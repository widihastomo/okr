import React from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SystemRoleManagement from "@/pages/system-role-management";
import ClientRoleManagement from "@/pages/client-role-management";

export default function UserManagement() {
  const { user } = useAuth();
  
  // Type guard for user object
  const userTyped = user as any;

  // Check if current user has access to user management
  if (!userTyped?.role || (userTyped.role !== "organization_admin" && !userTyped.isSystemOwner)) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (userTyped.isSystemOwner) {
    // System owners can see system-wide role management
    return <SystemRoleManagement />;
  } else {
    // Organization admins see client role management
    return <ClientRoleManagement />;
  }
}