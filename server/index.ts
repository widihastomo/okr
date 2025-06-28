import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleCycleStatusUpdates } from "./cycle-status-updater";
import { populateDatabase } from "./populate-postgres";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add health check endpoint that responds immediately with 200 status
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Add root endpoint that responds quickly without expensive operations
  app.get('/', (_req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      message: 'OKR Management System is running',
      timestamp: new Date().toISOString() 
    });
  });

  const server = await registerRoutes(app);
  
  // Start automatic cycle status updates
  scheduleCycleStatusUpdates();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isDevelopment = process.env.NODE_ENV === "development" || app.get("env") === "development";
  if (isDevelopment) {
    await setupVite(app, server);
  } else {
    // Custom static file serving for production to avoid API route conflicts
    const path = await import("path");
    const fs = await import("fs");
    const distPath = path.resolve(import.meta.dirname, "public");
    
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // Only serve index.html for non-API routes and non-root routes
      app.use((req, res, next) => {
        // Skip API routes and root endpoint (already handled above)
        if (req.path.startsWith('/api/') || req.path === '/' || req.path === '/health') {
          return next();
        }
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.warn("Public directory not found, serving API only");
    }
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  // Add process handlers to prevent the application from exiting unexpectedly
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });

  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Move database population to run asynchronously after server starts
    // This prevents the process from exiting after database operations complete
    setImmediate(async () => {
      try {
        await populateDatabase();
        console.log("Database initialized successfully");
      } catch (error: any) {
        console.log("Database already populated or initialization failed:", error?.message || error);
      }
    });
  });
})();
