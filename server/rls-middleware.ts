import { Request, Response, NextFunction } from "express";
import { setRLSContext, clearRLSContext } from "./setup-rls";
import { storage } from "./storage";

/**
 * Middleware to set RLS context for authenticated requests
 * This ensures database-level security is applied based on user's organization
 */
export async function rlsMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip RLS setup for non-API routes
    if (!req.path.startsWith('/api')) {
      return next();
    }

    // Skip RLS setup for public routes
    const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];
    if (publicRoutes.includes(req.path)) {
      return next();
    }

    // Get user from session (set by requireAuth middleware)
    const userId = req.session?.userId;
    if (!userId) {
      // If no user in session, clear any existing RLS context (non-blocking)
      clearRLSContext().catch(err => console.error('Background RLS clear error:', err));
      return next();
    }

    // Get user details including organization
    const user = await storage.getUser(userId);
    if (!user) {
      clearRLSContext().catch(err => console.error('Background RLS clear error:', err));
      return next();
    }

    // Set RLS context with user's organization
    await setRLSContext(
      user.id,
      user.organizationId || '', // Use empty string if no organization
      user.isSystemOwner || false
    );

    // Continue with request
    next();

  } catch (error) {
    console.error('RLS middleware error:', error);
    // Don't block request on RLS errors, but clear context for safety (non-blocking)
    clearRLSContext().catch(clearError => {
      console.error('Error clearing RLS context:', clearError);
    });
    next();
  }
}

/**
 * Middleware to clear RLS context after request completes
 * This prevents context from leaking between requests
 */
export async function rlsCleanupMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Set up cleanup to run after response is sent (non-blocking)
    res.on('finish', () => {
      clearRLSContext().catch(error => {
        console.error('Error clearing RLS context after request:', error);
      });
    });

    next();
  } catch (error) {
    console.error('RLS cleanup middleware error:', error);
    next();
  }
}

/**
 * Middleware specifically for system owner operations
 * Forces system owner context for administrative operations
 */
export async function systemOwnerRLSMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await storage.getUser(userId);
    if (!user || !user.isSystemOwner) {
      return res.status(403).json({ error: 'System owner access required' });
    }

    // Set RLS context with system owner privileges
    await setRLSContext(user.id, user.organizationId || '', true);
    
    next();
  } catch (error) {
    console.error('System owner RLS middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}