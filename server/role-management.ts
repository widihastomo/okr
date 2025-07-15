import { db } from "./db";
import { users, userPermissions, roleTemplates, userActivityLog, organizations } from "../shared/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import type { 
  UserWithPermissions, 
  InsertUserPermission, 
  InsertRoleTemplate, 
  InsertUserActivityLog,
  Permission,
  PERMISSIONS 
} from "../shared/schema";

export class RoleManagementService {
  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: Permission, resource?: string): Promise<boolean> {
    try {
      // System owners have all permissions
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user[0]?.isSystemOwner) {
        return true;
      }

      // Check specific permission
      const permissions = await db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.permission, permission),
            resource ? eq(userPermissions.resource, resource) : undefined
          )
        );

      // Check if permission exists and hasn't expired
      return permissions.some(p => !p.expiresAt || new Date() < new Date(p.expiresAt));
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<UserWithPermissions> {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0]) {
        throw new Error("User not found");
      }

      const permissions = await db
        .select()
        .from(userPermissions)
        .where(eq(userPermissions.userId, userId));

      // Filter out expired permissions
      const activePermissions = permissions.filter(p => 
        !p.expiresAt || new Date() < new Date(p.expiresAt)
      );

      return {
        ...user[0],
        permissions: activePermissions,
      } as UserWithPermissions;
    } catch (error) {
      console.error("Error getting user permissions:", error);
      throw error;
    }
  }

  /**
   * Grant permission to a user
   */
  async grantPermission(
    userId: string, 
    permission: Permission, 
    grantedBy: string,
    resource?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Check if permission already exists
      const existing = await db
        .select()
        .from(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.permission, permission),
            resource ? eq(userPermissions.resource, resource) : undefined
          )
        );

      if (existing.length > 0) {
        return; // Permission already exists
      }

      await db.insert(userPermissions).values({
        userId,
        permission,
        resource,
        grantedBy,
        expiresAt,
      });

      // Log the activity
      await this.logActivity(userId, 'permission_granted', {
        permission,
        resource,
        grantedBy,
        expiresAt,
      }, grantedBy);
    } catch (error) {
      console.error("Error granting permission:", error);
      throw error;
    }
  }

  /**
   * Revoke permission from a user
   */
  async revokePermission(
    userId: string, 
    permission: Permission, 
    performedBy: string,
    resource?: string
  ): Promise<void> {
    try {
      await db
        .delete(userPermissions)
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.permission, permission),
            resource ? eq(userPermissions.resource, resource) : undefined
          )
        );

      // Log the activity
      await this.logActivity(userId, 'permission_revoked', {
        permission,
        resource,
      }, performedBy);
    } catch (error) {
      console.error("Error revoking permission:", error);
      throw error;
    }
  }

  /**
   * Create a role template
   */
  async createRoleTemplate(template: InsertRoleTemplate): Promise<string> {
    try {
      const result = await db.insert(roleTemplates).values(template).returning({ id: roleTemplates.id });
      
      // Log the activity
      await this.logActivity(template.createdBy, 'role_template_created', {
        templateName: template.name,
        permissions: template.permissions,
      }, template.createdBy);

      return result[0].id;
    } catch (error) {
      console.error("Error creating role template:", error);
      throw error;
    }
  }

  /**
   * Apply role template to a user
   */
  async applyRoleTemplate(
    userId: string, 
    templateId: string, 
    performedBy: string
  ): Promise<void> {
    try {
      // Get the role template
      const template = await db.select().from(roleTemplates).where(eq(roleTemplates.id, templateId)).limit(1);
      if (!template[0]) {
        throw new Error("Role template not found");
      }

      // Remove existing permissions for this user
      await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

      // Apply new permissions from template
      const permissions = template[0].permissions as Permission[];
      for (const permission of permissions) {
        await db.insert(userPermissions).values({
          userId,
          permission,
          grantedBy: performedBy,
        });
      }

      // Log the activity
      await this.logActivity(userId, 'role_template_applied', {
        templateId,
        templateName: template[0].name,
        permissions,
      }, performedBy);
    } catch (error) {
      console.error("Error applying role template:", error);
      throw error;
    }
  }

  /**
   * Get role templates for an organization
   */
  async getRoleTemplates(organizationId?: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(roleTemplates)
        .where(
          organizationId 
            ? eq(roleTemplates.organizationId, organizationId)
            : eq(roleTemplates.isSystem, true)
        )
        .orderBy(desc(roleTemplates.createdAt));
    } catch (error) {
      console.error("Error getting role templates:", error);
      throw error;
    }
  }

  /**
   * Update user role and permissions
   */
  async updateUserRole(
    userId: string,
    newRole: string,
    permissions: Permission[],
    performedBy: string
  ): Promise<void> {
    try {
      // Update user role
      await db
        .update(users)
        .set({ 
          role: newRole,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Remove existing permissions
      await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

      // Add new permissions
      for (const permission of permissions) {
        await db.insert(userPermissions).values({
          userId,
          permission,
          grantedBy: performedBy,
        });
      }

      // Log the activity
      await this.logActivity(userId, 'role_updated', {
        newRole,
        permissions,
      }, performedBy);
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  /**
   * Get users with their permissions for an organization
   */
  async getOrganizationUsers(organizationId: string): Promise<UserWithPermissions[]> {
    try {
      const orgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, organizationId));

      const usersWithPermissions: UserWithPermissions[] = [];

      for (const user of orgUsers) {
        const permissions = await db
          .select()
          .from(userPermissions)
          .where(eq(userPermissions.userId, user.id));

        const activePermissions = permissions.filter(p => 
          !p.expiresAt || new Date() < new Date(p.expiresAt)
        );

        usersWithPermissions.push({
          ...user,
          permissions: activePermissions,
        } as UserWithPermissions);
      }

      return usersWithPermissions;
    } catch (error) {
      console.error("Error getting organization users:", error);
      throw error;
    }
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: string,
    action: string,
    details: any,
    performedBy?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.insert(userActivityLog).values({
        userId,
        action,
        details,
        performedBy,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Get user activity log
   */
  async getUserActivityLog(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(userActivityLog)
        .where(eq(userActivityLog.userId, userId))
        .orderBy(desc(userActivityLog.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting user activity log:", error);
      throw error;
    }
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string, performedBy: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Log the activity
      await this.logActivity(userId, 'user_deactivated', {}, performedBy);
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw error;
    }
  }

  /**
   * Reactivate user
   */
  async reactivateUser(userId: string, performedBy: string): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Log the activity
      await this.logActivity(userId, 'user_reactivated', {}, performedBy);
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw error;
    }
  }

  /**
   * Get default permissions for a role
   */
  getDefaultPermissions(role: string): Permission[] {
    const defaultRoles = {
      owner: [
        'manage_users' as Permission,
        'invite_users' as Permission,
        'view_users' as Permission,
        'deactivate_users' as Permission,
        'create_objectives' as Permission,
        'edit_objectives' as Permission,
        'delete_objectives' as Permission,
        'view_objectives' as Permission,
        'create_initiatives' as Permission,
        'edit_initiatives' as Permission,
        'delete_initiatives' as Permission,
        'view_initiatives' as Permission,
        'view_analytics' as Permission,
        'export_data' as Permission,
        'manage_organization' as Permission,
        'manage_billing' as Permission,
        'system_admin' as Permission,
        'audit_logs' as Permission,
      ],
      administrator: [
        'manage_users' as Permission,
        'invite_users' as Permission,
        'view_users' as Permission,
        'create_objectives' as Permission,
        'edit_objectives' as Permission,
        'delete_objectives' as Permission,
        'view_objectives' as Permission,
        'create_initiatives' as Permission,
        'edit_initiatives' as Permission,
        'delete_initiatives' as Permission,
        'view_initiatives' as Permission,
        'view_analytics' as Permission,
        'export_data' as Permission,
        'manage_organization' as Permission,
        'manage_billing' as Permission,
      ],
      member: [
        'view_users' as Permission,
        'create_objectives' as Permission,
        'edit_objectives' as Permission,
        'delete_objectives' as Permission,
        'view_objectives' as Permission,
        'create_initiatives' as Permission,
        'edit_initiatives' as Permission,
        'delete_initiatives' as Permission,
        'view_initiatives' as Permission,
        'view_analytics' as Permission,
        'export_data' as Permission,
      ],
      viewer: [
        'view_users' as Permission,
        'view_objectives' as Permission,
        'view_initiatives' as Permission,
        'view_analytics' as Permission,
      ],
    };

    return defaultRoles[role as keyof typeof defaultRoles] || [];
  }
}

export const roleManagementService = new RoleManagementService();