import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification, User } from "@shared/schema";

interface NotificationContextType {
  notifications: (Notification & { actor?: User })[];
  unreadCount: number;
  isLoading: boolean;
  refetchNotifications: () => void;
  refetchUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery<(Notification & { actor?: User })[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 120000, // Refetch every 2 minutes (reduced from 30 seconds)
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false, // Prevent excessive refetching on focus
  });

  const { data: unreadCountData, isLoading: countLoading, refetch: refetchUnreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 60000, // Refetch every 1 minute (reduced from 15 seconds)
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Prevent excessive refetching on focus
  });

  const unreadCount = unreadCountData?.count || 0;
  const isLoading = notificationsLoading || countLoading;

  // Auto-refresh when notifications change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetchNotifications();
        refetchUnreadCount();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refetchNotifications, refetchUnreadCount]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refetchNotifications,
    refetchUnreadCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}