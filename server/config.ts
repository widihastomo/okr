// Environment validation and configuration management
export function validateEnvironment() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
}

export function getConfig() {
  const port = parseInt(process.env.PORT || "5000", 10);
  
  return {
    port,
    host: "0.0.0.0", // Ensure external access
    isDevelopment: process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined,
    isProduction: process.env.NODE_ENV === "production",
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET || "okr-management-secret-2025",
    healthUrl: `http://localhost:${port}/health`,
    baseUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : `http://localhost:${port}`,
  };
}