import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface Task {
  id: string;
  status: string;
  dueDate?: string;
  [key: string]: any;
}

export function useTaskNotifications() {
  const { user } = useAuth();
  const userId = user && typeof user === 'object' && 'id' in user ? (user as any).id : null;

  const { data: rawTasks = [] } = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
    staleTime: 0, // Always refetch to ensure we get latest tasks
  });

  const tasks = Array.isArray(rawTasks) ? rawTasks as Task[] : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdueAndDueTodayCount = tasks.filter((task: Task) => {
    if (task.status === 'completed') return false;
    
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Include overdue tasks (due before today) and tasks due today
    const isUrgent = dueDate <= today;
    
    return isUrgent;
  }).length;

  return {
    overdueAndDueTodayCount,
    hasNotifications: overdueAndDueTodayCount > 0
  };
}