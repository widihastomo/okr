import { useEffect, useState } from "react";
import { useLocation, useRouter } from "wouter";
import { useOrganizationContext } from "@/contexts/organization-context";
import { useAuth } from "@/hooks/useAuth";

interface SlugRouterProps {
  children: React.ReactNode;
}

export default function SlugRouter({ children }: SlugRouterProps) {
  const [location, setLocation] = useLocation();
  const { setSlug, slug, organization, isLoading } = useOrganizationContext();
  const { isAuthenticated, user } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setReady(true);
      return;
    }

    // Extract slug from URL path
    const pathSegments = location.split('/').filter(Boolean);
    const currentSlug = pathSegments.length > 0 ? pathSegments[0] : null;

    // If no slug in URL but user is system owner, redirect to system admin
    if (!currentSlug && (user as any)?.isSystemOwner) {
      setLocation("/system-admin");
      setReady(true);
      return;
    }

    // If no slug in URL but user is not system owner, redirect to their organization
    if (!currentSlug && user && !(user as any)?.isSystemOwner) {
      // Get user's organization slug from their profile
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(userData => {
          if (userData.organizationSlug) {
            setLocation(`/${userData.organizationSlug}/dashboard`);
          } else {
            // If no organization slug, redirect to organization selection
            setLocation("/select-organization");
          }
        })
        .catch(error => {
          console.error("Error getting user data:", error);
          setReady(true);
        });
      return;
    }

    // If slug in URL, set it in context
    if (currentSlug && currentSlug !== slug) {
      setSlug(currentSlug);
    }

    setReady(true);
  }, [location, isAuthenticated, user, setSlug, slug, setLocation]);

  // Loading state while determining slug
  if (!ready || (isAuthenticated && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  // If authenticated and no organization found with slug, show error
  if (isAuthenticated && slug && !organization && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <div className="w-6 h-6 text-red-600">❌</div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization Not Found</h2>
          <p className="text-gray-600">The organization "{slug}" was not found or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}