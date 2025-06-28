// Health check utilities for deployment monitoring
import { testDatabaseConnection } from "./db";

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  environment: string;
  database: 'connected' | 'disconnected';
  uptime: number;
  memory: {
    used: number;
    free: number;
    total: number;
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const startTime = Date.now();
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  
  // Get memory usage
  const memUsage = process.memoryUsage();
  
  return {
    status: dbConnected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      free: Math.round((memUsage.heapTotal - memUsage.heapUsed) / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
    }
  };
}