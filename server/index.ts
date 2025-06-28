import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { scheduleCycleStatusUpdates } from "./cycle-status-updater";
import { populateDatabase } from "./populate-postgres";
import { testDatabaseConnection } from "./db";

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

// Add process handlers to prevent the application from exiting unexpectedly
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Use environment PORT variable for deployment, fallback to 5000 for development
// In production, Replit sets the PORT environment variable automatically
const port = parseInt(process.env.PORT || "5000", 10);

(async () => {
  // Add immediate-response health check endpoint for deployment verification
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root endpoint will be handled by Vite (development) or static files (production)

  const server = await registerRoutes(app);
  
  // Start automatic cycle status updates
  scheduleCycleStatusUpdates();

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`Error ${status} on ${req.method} ${req.path}:`, err);
    
    res.status(status).json({ message });
    // Don't throw the error again to prevent server crashes
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
      
      // Serve index.html for non-API routes (skip health check only)
      app.use((req, res, next) => {
        // Skip API routes and health check endpoint
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return next();
        }
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.warn("Public directory not found, serving API only");
    }
  }

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
    console.log(`✅ Server started successfully`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Server listening on host: 0.0.0.0`);
    console.log(`📡 Port: ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/health`);
    log(`serving on port ${port}`);
  });

  // Move database population to run asynchronously after server is listening
  // This ensures the server responds to health checks immediately
  setImmediate(async () => {
    console.log("Testing database connection...");
    const dbConnected = await testDatabaseConnection();
    
    if (dbConnected) {
      console.log("Populating PostgreSQL database with sample data...");
      try {
        await populateDatabase();
        console.log("Database initialized successfully");
      } catch (error: any) {
        console.log("Database already populated, skipping initialization");
        // Don't let database errors crash the server
        console.error("Database initialization error:", error?.message || error);
      }
    } else {
      console.error("Database connection failed - server will continue without database");
    }
  });

  // Keep the process alive by preventing exit
  process.stdin.resume();
})();
