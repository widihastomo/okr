import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ReminderConfig {
  userId: string;
  cadence: 'harian' | 'mingguan' | 'bulanan';
  reminderTime: string; // Format: "HH:MM"
  reminderDay?: string; // For weekly reminders (1-7, Monday = 1)
  reminderDate?: string; // For monthly reminders (1-31)
  isActive: boolean;
  objectiveId?: string;
  teamFocus?: string;
}

export function useReminderConfig() {
  return useQuery<ReminderConfig | null>({
    queryKey: ["/api/reminders/config"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/reminders/config");
        return response;
      } catch (error) {
        console.error("Error fetching reminder config:", error);
        return null;
      }
    },
    retry: false
  });
}

export function useSaveReminderConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Partial<ReminderConfig>) => {
      return apiRequest("POST", "/api/reminders/config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/config"] });
    }
  });
}

export function useUpdateReminderConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Partial<ReminderConfig>) => {
      return apiRequest("PUT", "/api/reminders/config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/config"] });
    }
  });
}

export function useStartReminderScheduler() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reminders/schedule");
    }
  });
}

export function useEnableReminders() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reminders/enable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/config"] });
    }
  });
}

export function useDisableReminders() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reminders/disable");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders/config"] });
    }
  });
}

export function useReminderLogs() {
  return useQuery({
    queryKey: ["/api/reminders/logs"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/reminders/logs");
        return response;
      } catch (error) {
        console.error("Error fetching reminder logs:", error);
        return null;
      }
    },
    retry: false
  });
}