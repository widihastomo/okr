import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { Organization, OrganizationSubscription, SubscriptionPlan } from "@shared/schema";

interface OrganizationData {
  organization: Organization;
  subscription: OrganizationSubscription & { plan: SubscriptionPlan };
  isOwner: boolean;
}

export function useOrganization() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<OrganizationData>({
    queryKey: ["/api/my-organization-with-role"],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch("/api/my-organization-with-role");
      if (!response.ok) {
        throw new Error("Failed to fetch organization");
      }
      const data = await response.json();
      
      // Check if user is owner
      const isOwner = data.organization?.ownerId === (user as any)?.id || (user as any)?.role === "admin";
      
      return {
        ...data,
        isOwner
      };
    }
  });

  return {
    organization: data?.organization,
    subscription: data?.subscription,
    isOwner: data?.isOwner ?? false,
    isLoading,
    error
  };
}