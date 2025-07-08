import { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Organization, OrganizationSubscription, SubscriptionPlan } from "@shared/schema";

interface OrganizationContextType {
  organization: Organization | null;
  subscription: (OrganizationSubscription & { plan: SubscriptionPlan }) | null;
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
  slug: string | null;
  setSlug: (slug: string | null) => void;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const [slug, setSlug] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<{
    organization: Organization;
    subscription: OrganizationSubscription & { plan: SubscriptionPlan };
    isOwner: boolean;
  }>({
    queryKey: ["/api/org", slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) throw new Error("No slug provided");
      
      const response = await fetch(`/api/org/${slug}/details`);
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }
      return response.json();
    }
  });

  return (
    <OrganizationContext.Provider
      value={{
        organization: data?.organization || null,
        subscription: data?.subscription || null,
        isOwner: data?.isOwner || false,
        isLoading,
        error,
        slug,
        setSlug
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganizationContext must be used within an OrganizationProvider");
  }
  return context;
}