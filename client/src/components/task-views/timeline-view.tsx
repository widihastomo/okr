import { useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle
} from "lucide-react";
import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay, addDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineViewProps {
  tasks: any[];
  onEditTask: (task: any) => void;
  onDeleteTask: (task: any) => void;
  userId: string;
}

export default function TimelineView({ tasks, onEditTask, onDeleteTask, userId }: TimelineViewProps) {
  
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 border-green-200 text-green-800';
      case 'in_progress': return 'bg-blue-100 border-blue-200 text-blue-800';
      case 'cancelled': return 'bg-red-100 border-red-200 text-red-800';
      case 'not_started': return 'bg-gray-100 border-gray-200 text-gray-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Sedang Dikerjakan';
      case 'cancelled': return 'Dibatalkan';
      case 'not_started': return 'Belum Dimulai';
      default: return 'Belum Dimulai';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-green-100 border-green-200 text-green-800';
      default: return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getTaskPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return 'Sedang';
    }
  };

  const formatDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    
    const daysDiff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < -7) return `${Math.abs(daysDiff)} days ago`;
    if (daysDiff < 0) return `${Math.abs(daysDiff)} days ago`;
    if (daysDiff <= 7) return `In ${daysDiff} days`;
    
    return format(date, 'MMM dd, yyyy');
  };

  const getDateGroupColor = (dateString: string) => {
    const date = parseISO(dateString);
    const today = startOfDay(new Date());
    const taskDate = startOfDay(date);
    
    if (taskDate < today) return 'border-l-red-500 bg-red-50'; // Overdue
    if (isToday(date)) return 'border-l-blue-500 bg-blue-50'; // Today
    if (isTomorrow(date)) return 'border-l-yellow-500 bg-yellow-50'; // Tomorrow
    return 'border-l-gray-300 bg-gray-50'; // Future
  };

  // Group tasks by due date
  const taskGroups = useMemo(() => {
    const groups: { [key: string]: any[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDueDate: []
    };

    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const endOfWeek = addDays(today, 7);
    const endOfNextWeek = addDays(today, 14);

    tasks.forEach(task => {
      if (!task.dueDate) {
        groups.noDueDate.push(task);
        return;
      }

      const dueDate = startOfDay(parseISO(task.dueDate));
      
      if (dueDate < today) {
        groups.overdue.push(task);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(task);
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(task);
      } else if (dueDate <= endOfWeek) {
        groups.thisWeek.push(task);
      } else if (dueDate <= endOfNextWeek) {
        groups.nextWeek.push(task);
      } else {
        groups.later.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const GroupSection = ({ title, tasks, icon, colorClass }: { 
    title: string; 
    tasks: any[]; 
    icon: React.ReactNode; 
    colorClass: string;
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className={`border-l-4 ${colorClass} pl-6 pb-6`}>
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </div>
        
        <div className="space-y-3">
          {tasks.map(task => (
            <Card key={task.id} className="hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <Link href={`/tasks/${task.id}`}>
                          <h4 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer mb-1">
                            {task.title}
                          </h4>
                        </Link>
                        
                        {task.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(parseISO(task.dueDate), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                          
                          {task.assignedUser && (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {task.assignedUser.firstName?.charAt(0)}
                              </div>
                              <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
                            </div>
                          )}
                          
                          {task.initiative && (
                            <Link href={`/initiatives/${task.initiative.id}`}>
                              <span className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                📋 {task.initiative.title}
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge className={`${getTaskStatusColor(task.status)} text-xs px-2 py-1`}>
                      {getTaskStatusLabel(task.status)}
                    </Badge>
                    
                    <Badge className={`${getTaskPriorityColor(task.priority)} text-xs px-2 py-1`}>
                      {getTaskPriorityLabel(task.priority)}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTask(task)} className="cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDeleteTask(task)} className="cursor-pointer text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <GroupSection
        title="Overdue"
        tasks={taskGroups.overdue}
        icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
        colorClass="border-l-red-500 bg-red-50"
      />
      
      <GroupSection
        title="Today"
        tasks={taskGroups.today}
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        colorClass="border-l-blue-500 bg-blue-50"
      />
      
      <GroupSection
        title="Tomorrow"
        tasks={taskGroups.tomorrow}
        icon={<Calendar className="h-5 w-5 text-yellow-600" />}
        colorClass="border-l-yellow-500 bg-yellow-50"
      />
      
      <GroupSection
        title="This Week"
        tasks={taskGroups.thisWeek}
        icon={<Calendar className="h-5 w-5 text-green-600" />}
        colorClass="border-l-green-500 bg-green-50"
      />
      
      <GroupSection
        title="Next Week"
        tasks={taskGroups.nextWeek}
        icon={<Calendar className="h-5 w-5 text-purple-600" />}
        colorClass="border-l-purple-500 bg-purple-50"
      />
      
      <GroupSection
        title="Later"
        tasks={taskGroups.later}
        icon={<Calendar className="h-5 w-5 text-gray-600" />}
        colorClass="border-l-gray-500 bg-gray-50"
      />
      
      <GroupSection
        title="No Due Date"
        tasks={taskGroups.noDueDate}
        icon={<Circle className="h-5 w-5 text-gray-400" />}
        colorClass="border-l-gray-300 bg-gray-50"
      />

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-sm">Create a new task to get started</p>
        </div>
      )}
    </div>
  );
}