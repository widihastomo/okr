import React from "react";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import SystemRoleManagement from "@/pages/system-role-management";
import ClientUserManagement from "@/pages/client-user-management";

export default function UserManagement() {
  const { user } = useAuth();
  const { isOwner } = useOrganization();
  const userTyped = user as any;

  // Check if current user has access to user management
  if (!isOwner && !userTyped?.isSystemOwner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600">Anda tidak memiliki akses untuk mengelola pengguna.</p>
        </div>
      </div>
    );
  }

  // Redirect based on user role
  if (userTyped?.isSystemOwner) {
    // System owners see system-wide user management
    return <SystemRoleManagement />;
  } else {
    // Organization owners see client user management
    return <ClientUserManagement />;
  }
}