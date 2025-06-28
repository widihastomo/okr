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
  return {
    port: parseInt(process.env.PORT || "5000", 10),
    isDevelopment: process.env.NODE_ENV === "development" || process.env.NODE_ENV === undefined,
    isProduction: process.env.NODE_ENV === "production",
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET || "okr-management-secret-2025",
  };
}