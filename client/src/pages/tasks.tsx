import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { List, Kanban, Calendar as CalendarIcon, BarChart3, Plus, Filter, Search, Clock, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, MoreVertical, Edit, Trash2, Eye, User } from 'lucide-react';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { format as formatDate } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import TaskModal from '@/components/task-modal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Gantt, Task as GanttTask, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const locales = {
  'id': id,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  initiative?: {
    id: string;
    title: string;
  };
}

const TasksPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(() => {
    // Initialize based on window size
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });
  const [isMobile, setIsMobile] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    staleTime: 30000,
  });

  // Fetch users data for PIC display
  const { data: users = [] } = useQuery({
    queryKey: ['/api/organization/users'],
    staleTime: 60000,
  });

  // Fetch teams data for team filter
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    staleTime: 60000,
  });

  // Set default user filter to signed in user
  useEffect(() => {
    if (user && user.id && userFilter === '') {
      setUserFilter(user.id);
    }
  }, [user, userFilter]);

  // Mobile detection and default collapse state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set initial collapse state based on mobile detection
  useEffect(() => {
    console.log('Mobile detection effect:', { isMobile, isFilterCollapsed });
    if (isMobile && !isFilterCollapsed) {
      console.log('Setting filter to collapsed for mobile');
      setIsFilterCollapsed(true);
    }
  }, [isMobile]);

  // Helper function to get user name
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'User';
    
    // Use consolidated name field
    if (user.name && user.name.trim() !== '') {
      return user.name.trim();
    }
    
    // Fallback to email without @domain
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  // Helper function to get user initials
  const getUserInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'U';
    const name = user.name || "";
    if (name && name.trim() !== '') {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : 'U';
  };

  // Helper function to get user profile image URL
  const getUserProfileImage = (userId: string): string | undefined => {
    if (!userId || !users) return undefined;
    const user = users.find((u: any) => u.id === userId);
    return user?.profileImageUrl || undefined;
  };

  // Helper function to get team names for a user
  const getUserTeams = (userId: string) => {
    return teams.filter(team => 
      team.members?.some(member => member.userId === userId) || 
      team.ownerId === userId
    );
  };

  // Filter active users only
  const activeUsers = users.filter(user => user.isActive === true);

  // Helper function to check if task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
  };

  // Helper function to categorize tasks by due date
  // Helper function to categorize tasks by date - matching Daily Focus logic
  const categorizeTaskByDate = (task: Task): 'overdue' | 'today' | 'upcoming' => {
    if (!task.dueDate) return 'upcoming';
    
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today && task.status !== 'completed' && task.status !== 'cancelled') {
      return 'overdue';
    } else if (dueDate.getTime() === today.getTime()) {
      return 'today';
    } else {
      return 'upcoming';
    }
  };

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesUser = userFilter === 'all' || userFilter === '' || task.assignedTo === userFilter;
      const matchesTeam = teamFilter === 'all' || (task.assignedTo && getUserTeams(task.assignedTo).some(team => team.id === teamFilter));
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesUser && matchesTeam && matchesSearch;
    });

    // Sort tasks: overdue first, then by due date
    return filtered.sort((a, b) => {
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      
      // If one is overdue and the other is not, overdue comes first
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // If both are overdue or both are not overdue, sort by due date
      const aDate = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
      const bDate = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
      
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks, statusFilter, priorityFilter, userFilter, teamFilter, searchTerm]);

  // Group tasks by date categories
  const groupedTasks = useMemo(() => {
    // Overdue tasks use dueDate (tasks that were due before today)
    const overdueTasks = filteredTasks.filter((task: Task) => {
      return categorizeTaskByDate(task) === 'overdue';
    });

    // Today's tasks - use startDate if available, otherwise fallback to dueDate
    // Also include in-progress tasks regardless of date
    const todayTasks = filteredTasks.filter((task: Task) => {
      if (task.status === "in_progress") return true;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check startDate first for today's tasks
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate.getTime() === today.getTime()) return true;
      }
      
      // Fallback to dueDate logic for backward compatibility
      return categorizeTaskByDate(task) === 'today';
    });

    // Tomorrow's tasks - use startDate if available, otherwise fallback to dueDate
    const tomorrowTasks = filteredTasks.filter((task: Task) => {
      if (task.status === "completed" || task.status === "cancelled") return false;
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Reset time to compare only dates
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Check startDate first for tomorrow's tasks
      if (task.startDate) {
        const startDate = new Date(task.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate.getTime() === tomorrow.getTime();
      }
      
      // Fallback to dueDate logic for backward compatibility
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === tomorrow.getTime();
      }
      
      return false;
    });

    // Upcoming tasks (excluding overdue, today, and tomorrow)
    const upcomingTasks = filteredTasks.filter((task: Task) => {
      if (task.status === "completed" || task.status === "cancelled") return false;
      
      // Exclude tasks that are in other categories
      const isOverdue = categorizeTaskByDate(task) === 'overdue';
      const isToday = todayTasks.includes(task);
      const isTomorrow = tomorrowTasks.includes(task);
      
      return !isOverdue && !isToday && !isTomorrow;
    });
    
    return {
      overdue: overdueTasks,
      today: todayTasks,
      tomorrow: tomorrowTasks,
      upcoming: upcomingTasks
    };
  }, [filteredTasks]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest('DELETE', `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Berhasil",
        description: "Task berhasil dihapus",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Gagal menghapus task",
        variant: "destructive"
      });
    }
  });

  // Handle edit task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus task ini?')) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Handle add new task
  const handleAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setDraggedTask(task || null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    // Find the task and update its status
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      handleStatusUpdate(taskId, newStatus as Task['status']);
    }
    
    setDraggedTask(null);
  };

  // Droppable Column Component
  const DroppableColumn = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    
    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''} transition-all duration-200`}
      >
        {children}
      </div>
    );
  };

  // Draggable Task Card Component
  const DraggableTaskCard = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${
          isTaskOverdue(task) ? 'border-l-4 border-l-red-400 bg-red-50' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-sm text-gray-900 flex-1 pr-2">
            {task.title}
          </h4>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getTaskPriorityColor(task.priority || 'medium')}`} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${task.id}`} className="flex items-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Lihat Detail
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditTask(task)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {task.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}
        
        {task.initiative && (
          <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mb-3 inline-block">
            {task.initiative.title}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignedTo ? (
              <Avatar className="w-5 h-5">
                <AvatarImage src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)} />
                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                  {getUserInitials(task.assignedTo)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-xs text-gray-600">
              {task.assignedTo ? getUserName(task.assignedTo) : "Belum ditentukan"}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isTaskOverdue(task) && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
            <div className="text-xs text-gray-500">
              {task.dueDate ? formatDate(new Date(task.dueDate), 'dd/MM') : 'No date'}
            </div>
          </div>
        </div>
      </div>
    );
  };



  // Status update mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/tasks/${taskId}`, { status });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      const statusMessages = {
        'not_started': 'Status task diubah menjadi "Belum Dimulai"',
        'in_progress': 'Status task diubah menjadi "Sedang Berjalan"',
        'completed': 'Status task diubah menjadi "Selesai"',
        'cancelled': 'Status task diubah menjadi "Dibatalkan"'
      };
      
      toast({
        title: "Status berhasil diperbarui",
        description: statusMessages[variables.status as keyof typeof statusMessages] || "Status task telah diperbarui.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-800",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui status",
        description: "Terjadi kesalahan saat memperbarui status task.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (taskId: string, status: string) => {
    updateTaskStatusMutation.mutate({ taskId, status });
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "in_progress":
        return "Sedang Berjalan";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Belum Dimulai";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Tinggi";
      case "medium":
        return "Sedang";
      case "low":
        return "Rendah";
      default:
        return "Sedang";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_started': return 'Belum Mulai';
      case 'in_progress': return 'Sedang Berjalan';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Rendah';
      case 'medium': return 'Sedang';
      case 'high': return 'Tinggi';
      default: return priority;
    }
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="mt-1">{task.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {getStatusText(task.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{task.initiative?.title || 'Tidak ada inisiatif'}</span>
          <span>Due: {new Date(task.dueDate).toLocaleDateString('id-ID')}</span>
        </div>
      </CardContent>
    </Card>
  );

  const renderTaskRow = (task: Task) => (
    <tr key={task.id} className={`hover:bg-gray-50 ${isTaskOverdue(task) ? 'bg-red-50 border-l-4 border-red-400' : ''}`}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/tasks/${task.id}`}
                className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
              >
                {task.title}
              </Link>
              {isTaskOverdue(task) && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
            </div>
            {task.initiative && (
              <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
                Inisiatif: {task.initiative.title}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <Badge className={getTaskPriorityColor(task.priority || "medium")}>
          {getTaskPriorityLabel(task.priority || "medium")}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
            >
              {getTaskStatusLabel(task.status)}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "not_started")}>
              Belum Dimulai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "in_progress")}>
              Sedang Berjalan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "completed")}>
              Selesai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "cancelled")}>
              Dibatalkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">
        {task.startDate ? formatDate(new Date(task.startDate), 'dd/MM/yyyy') : 'Tidak diatur'}
      </td>
      <td className="px-4 py-4 text-sm text-gray-500">
        {task.dueDate ? formatDate(new Date(task.dueDate), 'dd/MM/yyyy') : 'Tidak ada'}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <Avatar className="w-6 h-6">
              <AvatarImage src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getUserInitials(task.assignedTo)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="text-sm text-gray-600">
            {task.assignedTo
              ? getUserName(task.assignedTo)
              : "Belum ditentukan"}
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditTask(task)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );

  const renderTaskCard = (task: Task) => (
    <div key={task.id} className={`p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 ${isTaskOverdue(task) ? 'bg-red-50 border-red-300 border-l-4 border-l-red-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/tasks/${task.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
            >
              {task.title}
            </Link>
            {isTaskOverdue(task) && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          {task.initiative && (
            <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
              Inisiatif: {task.initiative.title}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Badge className={getTaskPriorityColor(task.priority || "medium")}>
              {getTaskPriorityLabel(task.priority || "medium")}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1 cursor-pointer hover:opacity-80 flex items-center gap-1 rounded-full border font-medium`}
            >
              {getTaskStatusLabel(task.status)}
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "not_started")}>
              Belum Dimulai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "in_progress")}>
              Sedang Berjalan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "completed")}>
              Selesai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate(task.id, "cancelled")}>
              Dibatalkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <Avatar className="w-5 h-5">
              <AvatarImage src={getUserProfileImage(task.assignedTo)} alt={getUserName(task.assignedTo)} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {getUserInitials(task.assignedTo)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className="text-xs text-gray-600">
            {task.assignedTo
              ? getUserName(task.assignedTo)
              : "Belum ditentukan"}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="text-gray-600">
            <span className="font-medium">Mulai:</span> {task.startDate ? formatDate(new Date(task.startDate), 'dd/MM/yyyy') : 'Tidak diatur'}
          </div>
          <div className="text-gray-600">
            <span className="font-medium">Tenggat:</span> {task.dueDate ? formatDate(new Date(task.dueDate), 'dd/MM/yyyy') : 'Tidak ada'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/tasks/${task.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteTask(task.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  const ListView = () => {
    const categories = [
      { key: 'overdue', title: 'Terlambat', tasks: groupedTasks.overdue, color: 'text-red-600' },
      { key: 'today', title: 'Hari Ini', tasks: groupedTasks.today, color: 'text-blue-600' },
      { key: 'tomorrow', title: 'Besok', tasks: groupedTasks.tomorrow, color: 'text-green-600' },
      { key: 'upcoming', title: 'Akan Datang', tasks: groupedTasks.upcoming, color: 'text-gray-600' }
    ];

    return (
      <div className="space-y-6">
        {categories.map(category => (
          category.tasks.length > 0 && (
            <Card key={category.key}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${category.color}`}>
                  {category.title} ({category.tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop View */}
                <div className="hidden md:block">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prioritas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal Mulai
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenggat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PIC
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.tasks.map(renderTaskRow)}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-4 p-4">
                  {category.tasks.map(renderTaskCard)}
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    );
  };

  const KanbanView = () => {
    const columns = [
      { id: 'not_started', title: 'Belum Mulai', color: 'bg-gray-50', borderColor: 'border-gray-200', headerColor: 'text-gray-700' },
      { id: 'in_progress', title: 'Sedang Berjalan', color: 'bg-blue-50', borderColor: 'border-blue-200', headerColor: 'text-blue-700' },
      { id: 'completed', title: 'Selesai', color: 'bg-green-50', borderColor: 'border-green-200', headerColor: 'text-green-700' },
      { id: 'cancelled', title: 'Dibatalkan', color: 'bg-red-50', borderColor: 'border-red-200', headerColor: 'text-red-700' }
    ];

    return (
      <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => {
            const columnTasks = filteredTasks.filter(task => task.status === column.id);
            
            return (
              <DroppableColumn
                key={column.id}
                id={column.id}
                className={`${column.color} ${column.borderColor} border-2 rounded-lg p-4 min-h-[600px] transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${column.headerColor} text-center flex-1`}>
                    {column.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
                
                <SortableContext
                  items={columnTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {columnTasks.map(task => (
                      <DraggableTaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </SortableContext>
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">Tidak ada task</p>
                  </div>
                )}
              </DroppableColumn>
            );
          })}
        </div>
        
        <DragOverlay>
          {draggedTask && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 transform rotate-2">
              <h4 className="font-medium text-sm text-gray-900 mb-2">
                {draggedTask.title}
              </h4>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getTaskPriorityColor(draggedTask.priority || 'medium')}`} />
                <span className="text-xs text-gray-500">
                  {draggedTask.dueDate ? formatDate(new Date(draggedTask.dueDate), 'dd/MM') : 'No date'}
                </span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  };

  const GanttView = () => {
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
    
    // Convert tasks to Gantt format
    const ganttTasks = useMemo(() => {
      return filteredTasks.map((task, index) => {
        const start = new Date(task.createdAt);
        const end = new Date(task.dueDate);
        
        // Ensure end date is after start date
        if (end <= start) {
          end.setTime(start.getTime() + 24 * 60 * 60 * 1000); // Add 1 day
        }
        
        let type: 'task' | 'milestone' | 'project' = 'task';
        let progress = 0;
        
        // Calculate progress based on status
        switch (task.status) {
          case 'completed':
            progress = 100;
            break;
          case 'in_progress':
            progress = 50;
            break;
          case 'cancelled':
            progress = 0;
            break;
          default:
            progress = 0;
        }
        
        return {
          start,
          end,
          name: task.title,
          id: task.id,
          type,
          progress,
          isDisabled: task.status === 'cancelled',
          styles: {
            backgroundColor: task.status === 'completed' ? '#10b981' : 
                           task.status === 'in_progress' ? '#3b82f6' : 
                           task.status === 'cancelled' ? '#ef4444' : '#6b7280',
            backgroundSelectedColor: task.status === 'completed' ? '#059669' : 
                                   task.status === 'in_progress' ? '#2563eb' : 
                                   task.status === 'cancelled' ? '#dc2626' : '#4b5563',
            progressColor: '#ffffff',
            progressSelectedColor: '#ffffff',
          },
          project: task.initiative?.title || 'Umum',
          dependencies: [],
        } as GanttTask;
      });
    }, [filteredTasks]);

    // Gantt chart event handlers
    const handleTaskChange = (task: GanttTask) => {
      console.log('Task changed:', task);
      // You can implement task update logic here
    };

    const handleTaskDelete = (task: GanttTask) => {
      handleDeleteTask(task.id);
    };

    const handleExpanderClick = (task: GanttTask) => {
      console.log('Expander clicked:', task);
    };

    const handleDateChange = (task: GanttTask, children: GanttTask[]) => {
      console.log('Date changed:', task, children);
    };

    const handleProgressChange = (task: GanttTask, children: GanttTask[]) => {
      console.log('Progress changed:', task, children);
    };

    const handleDoubleClick = (task: GanttTask) => {
      // Find the original task and open edit modal
      const originalTask = filteredTasks.find(t => t.id === task.id);
      if (originalTask) {
        handleEditTask(originalTask);
      }
    };

    const handleSelect = (task: GanttTask, isSelected: boolean) => {
      console.log('Task selected:', task, isSelected);
    };

    if (ganttTasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Tidak ada task untuk ditampilkan di Gantt chart</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* View Mode Controls */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium">Tampilan:</span>
          <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ViewMode.Day}>Hari</SelectItem>
              <SelectItem value={ViewMode.Week}>Minggu</SelectItem>
              <SelectItem value={ViewMode.Month}>Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gantt Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-hidden">
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleDateChange}
            onTaskChange={handleTaskChange}
            onTaskDelete={handleTaskDelete}
            onExpanderClick={handleExpanderClick}
            onProgressChange={handleProgressChange}
            onDoubleClick={handleDoubleClick}
            onSelect={handleSelect}
            locale="id"
            listCellWidth="200px"
            columnWidth={60}
            rowHeight={50}
            ganttHeight={Math.max(400, ganttTasks.length * 50 + 100)}
            barBackgroundColor="#f3f4f6"
            barBackgroundSelectedColor="#e5e7eb"
            arrowColor="#6b7280"
            arrowIndent={20}
            todayColor="#fbbf24"
            TooltipContent={({ task, fontSize, fontFamily }) => (
              <div className="bg-white p-3 rounded shadow-lg border border-gray-200 max-w-xs">
                <div className="font-medium text-sm mb-1">{task.name}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Mulai: {formatDate(task.start, 'dd/MM/yyyy')}</div>
                  <div>Selesai: {formatDate(task.end, 'dd/MM/yyyy')}</div>
                  <div>Progress: {task.progress}%</div>
                  {task.project && <div>Proyek: {task.project}</div>}
                </div>
              </div>
            )}
          />
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const events = filteredTasks.map(task => ({
      id: task.id,
      title: task.title,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      resource: task,
    }));

    const eventStyleGetter = (event: any) => {
      const task = event.resource;
      let backgroundColor = '#3174ad';
      
      switch (task.status) {
        case 'completed':
          backgroundColor = '#10b981';
          break;
        case 'in_progress':
          backgroundColor = '#3b82f6';
          break;
        case 'cancelled':
          backgroundColor = '#ef4444';
          break;
        default:
          backgroundColor = '#6b7280';
      }

      return {
        style: {
          backgroundColor,
          borderRadius: '5px',
          opacity: 0.8,
          color: 'white',
          border: '0px',
          display: 'block',
        },
      };
    };

    return (
      <div style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          culture="id"
          messages={{
            next: 'Selanjutnya',
            previous: 'Sebelumnya',
            today: 'Hari Ini',
            month: 'Bulan',
            week: 'Minggu',
            day: 'Hari',
            agenda: 'Agenda',
            date: 'Tanggal',
            time: 'Waktu',
            event: 'Acara',
            noEventsInRange: 'Tidak ada task dalam rentang ini',
          }}
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-600">Kelola semua task dalam berbagai tampilan</p>
        </div>
        <Button 
          onClick={handleAddTask}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Task
        </Button>
      </div>

      {/* Filters */}
      <Card data-tour="tasks-filter">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter & Pencarian
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Toggle clicked, current state:', isFilterCollapsed);
                  setIsFilterCollapsed(!isFilterCollapsed);
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Touch start, current state:', isFilterCollapsed);
                  setIsFilterCollapsed(!isFilterCollapsed);
                }}
                className="ml-2 p-1 h-6 w-6 touch-manipulation"
              >
                {isFilterCollapsed ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </Button>
            </div>
            {/* Filter indicators */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                  Status: {statusFilter === 'not_started' ? 'Belum Mulai' : statusFilter === 'in_progress' ? 'Sedang Berjalan' : statusFilter === 'completed' ? 'Selesai' : 'Dibatalkan'}
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full whitespace-nowrap">
                  Prioritas: {priorityFilter === 'low' ? 'Rendah' : priorityFilter === 'medium' ? 'Sedang' : 'Tinggi'}
                </span>
              )}
              {userFilter !== 'all' && userFilter !== '' && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                  PIC: {getUserName(userFilter)}
                </span>
              )}
              {teamFilter !== 'all' && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full whitespace-nowrap">
                  Tim: {teams.find(t => t.id === teamFilter)?.name || 'Unknown'}
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
          <CardContent className="space-y-4">
            {/* Search Row */}
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            
            {/* Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="not_started">Belum Mulai</SelectItem>
                    <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Prioritas</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter Prioritas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Prioritas</SelectItem>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="medium">Sedang</SelectItem>
                    <SelectItem value="high">Tinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">PIC</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter PIC" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua PIC</SelectItem>
                    {activeUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {getUserName(user.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tim</label>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter Tim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tim</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Task Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center justify-center">
            <List className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center justify-center">
            <Kanban className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center justify-center">
            <BarChart3 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center justify-center">
            <CalendarIcon className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <ListView />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <KanbanView />
        </TabsContent>

        <TabsContent value="gantt" className="space-y-4">
          <GanttView />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <CalendarView />
        </TabsContent>
      </Tabs>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 text-center">
              <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Tidak ada task ditemukan</h3>
              <p>Coba ubah filter atau tambah task baru</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {filteredTasks.length > 0 && groupedTasks.overdue.length === 0 && groupedTasks.today.length === 0 && groupedTasks.upcoming.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-500 text-center">
              <List className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Tidak ada task dalam kategori yang dipilih</h3>
              <p>Coba ubah filter atau tambah task baru</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Modal */}
      <TaskModal
        open={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          // Refresh tasks after modal closes
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        }}
        task={editingTask}
        isAdding={!editingTask}
      />
    </div>
  );
};

export default TasksPage;