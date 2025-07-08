import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { organizationSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@shared/schema';

/**
 * Middleware to check if user's trial has expired
 * If trial has expired, redirect to pricing page or show upgrade message
 */
export const checkTrialExpiration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    
    // Skip check for system owners
    if (user?.isSystemOwner) {
      return next();
    }
    
    // Skip check if user is not authenticated
    if (!user || !user.organizationId) {
      return next();
    }
    
    // Get organization subscription
    const [orgSubscription] = await db.select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, user.organizationId));
    
    if (!orgSubscription) {
      return next();
    }
    
    // Check if it's a trial and if it has expired
    if (orgSubscription.status === 'trialing' && orgSubscription.trialEnd) {
      const now = new Date();
      const trialEnd = new Date(orgSubscription.trialEnd);
      
      if (now > trialEnd) {
        // Trial has expired, update status to expired
        await db.update(organizationSubscriptions)
          .set({ status: 'past_due' })
          .where(eq(organizationSubscriptions.id, orgSubscription.id));
        
        // For API requests, return 402 Payment Required
        if (req.path.startsWith('/api/')) {
          return res.status(402).json({ 
            message: 'Trial period has expired. Please upgrade your subscription to continue using the service.',
            trialExpired: true,
            upgradeUrl: '/pricing'
          });
        }
        
        // For web requests, redirect to pricing page
        return res.redirect('/pricing?trial_expired=true');
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking trial expiration:', error);
    next(); // Continue on error to avoid breaking the application
  }
};

/**
 * Middleware to check trial expiration for specific protected routes
 * Use this for routes that should be blocked when trial expires
 */
export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as User;
    
    // Skip check for system owners
    if (user?.isSystemOwner) {
      return next();
    }
    
    // Skip check if user is not authenticated
    if (!user || !user.organizationId) {
      return next();
    }
    
    // Get organization subscription
    const [orgSubscription] = await db.select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, user.organizationId));
    
    if (!orgSubscription) {
      return res.status(402).json({ 
        message: 'No active subscription found. Please subscribe to continue using the service.',
        subscriptionRequired: true,
        upgradeUrl: '/pricing'
      });
    }
    
    // Check if subscription is active or in trial
    if (orgSubscription.status === 'past_due' || orgSubscription.status === 'cancelled') {
      return res.status(402).json({ 
        message: 'Your subscription has expired. Please upgrade to continue using the service.',
        subscriptionExpired: true,
        upgradeUrl: '/pricing'
      });
    }
    
    // Check if trial has expired
    if (orgSubscription.status === 'trialing' && orgSubscription.trialEnd) {
      const now = new Date();
      const trialEnd = new Date(orgSubscription.trialEnd);
      
      if (now > trialEnd) {
        // Update status to expired
        await db.update(organizationSubscriptions)
          .set({ status: 'past_due' })
          .where(eq(organizationSubscriptions.id, orgSubscription.id));
        
        return res.status(402).json({ 
          message: 'Trial period has expired. Please upgrade your subscription to continue using the service.',
          trialExpired: true,
          upgradeUrl: '/pricing'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    next(); // Continue on error to avoid breaking the application
  }
};