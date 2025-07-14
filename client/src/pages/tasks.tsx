import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { List, Kanban, Calendar as CalendarIcon, BarChart3, Plus, Filter, Search, Clock, AlertTriangle, CheckCircle, ChevronDown, MoreVertical, Edit, Trash2, Eye, User } from 'lucide-react';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiRequest } from '@/lib/queryClient';
import { format as formatDate } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
  const [activeTab, setActiveTab] = useState('list');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    staleTime: 30000,
  });

  // Fetch users data for PIC display
  const { data: users = [] } = useQuery({
    queryKey: ['/api/organization/users'],
    staleTime: 60000,
  });

  // Helper function to check if task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== 'completed' && task.status !== 'cancelled';
  };

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesSearch = searchTerm === '' || 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
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
  }, [tasks, statusFilter, priorityFilter, searchTerm]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper function to get user name by ID (matching daily-focus page format)
  const getUserName = (userId: string): string => {
    if (!users || !userId) return "Tidak ditentukan";
    const user = users.find((u: any) => u.id === userId);

    // Check if firstName and lastName are both present and non-empty
    if (user?.firstName && user?.lastName && user.lastName.trim() !== "") {
      return `${user.firstName} ${user.lastName}`;
    }

    // Fallback to firstName only if available and non-empty
    if (user?.firstName && user.firstName.trim() !== "") {
      return user.firstName;
    }

    // Fallback to lastName only if available and non-empty
    if (user?.lastName && user.lastName.trim() !== "") {
      return user.lastName;
    }

    return "Pengguna";
  };

  // Helper function to get user initials by ID (matching daily-focus page format)
  const getUserInitials = (userId: string): string => {
    if (!users || !userId) return "?";
    const user = users.find((u: any) => u.id === userId);

    // Check if firstName and lastName are both present and non-empty
    if (user?.firstName && user?.lastName && user.lastName.trim() !== "") {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }

    // Fallback to firstName only if available and non-empty
    if (user?.firstName && user.firstName.trim() !== "") {
      return user.firstName.charAt(0).toUpperCase();
    }

    // Fallback to lastName only if available and non-empty
    if (user?.lastName && user.lastName.trim() !== "") {
      return user.lastName.charAt(0).toUpperCase();
    }

    return "U";
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

  const ListView = () => {
    return (
      <Card>
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
                {filteredTasks.map((task) => (
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
                      {task.dueDate ? formatDate(new Date(task.dueDate), 'dd/MM/yyyy') : 'Tidak ada'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {task.assignedTo ? (
                          <Avatar className="w-6 h-6">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`}
                            />
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4 p-4">
            {filteredTasks.map((task) => (
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
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${getUserName(task.assignedTo)}`}
                        />
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
                  <span>{task.dueDate ? formatDate(new Date(task.dueDate), 'dd/MM/yyyy') : 'Tidak ada tenggat'}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanView = () => {
    const columns = [
      { id: 'not_started', title: 'Belum Mulai', color: 'bg-gray-50' },
      { id: 'in_progress', title: 'Sedang Berjalan', color: 'bg-blue-50' },
      { id: 'completed', title: 'Selesai', color: 'bg-green-50' },
      { id: 'cancelled', title: 'Dibatalkan', color: 'bg-red-50' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <div key={column.id} className={`${column.color} p-4 rounded-lg`}>
            <h3 className="font-semibold mb-4 text-center">{column.title}</h3>
            <div className="space-y-3">
              {filteredTasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <Card key={task.id} className="p-3 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString('id-ID')}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const GanttView = () => {
    const sortedTasks = [...filteredTasks].sort((a, b) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-4">Timeline Tasks</h3>
          <div className="space-y-3">
            {sortedTasks.map(task => (
              <div key={task.id} className="flex items-center space-x-4">
                <div className="w-48 truncate">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-gray-500">{task.initiative?.title}</div>
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}></div>
                      <Badge variant="outline" className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(task.dueDate).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-600">Kelola semua task dalam berbagai tampilan</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari task..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
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
        </CardContent>
      </Card>

      {/* Task Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list" className="flex items-center">
            <List className="w-4 h-4 mr-2" />
            List
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center">
            <Kanban className="w-4 h-4 mr-2" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar
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
    </div>
  );
};

export default TasksPage;