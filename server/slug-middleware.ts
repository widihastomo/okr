import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { setRLSContext } from "./setup-rls";

declare module "express-serve-static-core" {
  interface Request {
    organization?: any;
    organizationSlug?: string;
  }
}

/**
 * Middleware to extract organization from slug in URL
 */
export const extractOrganizationFromSlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract slug from URL path
    const pathSegments = req.path.split('/').filter(Boolean);
    
    // Check if path starts with /api/org/{slug}
    if (pathSegments.length >= 3 && pathSegments[0] === 'api' && pathSegments[1] === 'org') {
      const slug = pathSegments[2];
      
      // Get organization by slug
      const organization = await storage.getOrganizationBySlug(slug);
      
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      req.organization = organization;
      req.organizationSlug = slug;
      
      // Set RLS context if user is authenticated
      if (req.session?.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          await setRLSContext(
            user.id,
            organization.id,
            user.isSystemOwner || false
          );
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Error in extractOrganizationFromSlug middleware:", error);
    next(error);
  }
};

/**
 * Middleware to verify user has access to organization
 */
export const verifyOrganizationAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.organization) {
      return res.status(400).json({ message: "Organization context not found" });
    }
    
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // System owners can access any organization
    if (user.isSystemOwner) {
      return next();
    }
    
    // Check if user belongs to the organization
    if (user.organizationId !== req.organization.id) {
      return res.status(403).json({ message: "Access denied to this organization" });
    }
    
    next();
  } catch (error) {
    console.error("Error in verifyOrganizationAccess middleware:", error);
    next(error);
  }
};