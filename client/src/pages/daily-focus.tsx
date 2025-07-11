import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Target,
  BarChart3,
  Trophy,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Eye,
  User,
  Edit,
  Trash2,
  Check,
  ExternalLink,
  Plus,
  ChevronsUpDown,
  Rocket,
  Sparkles,
  CheckCircle2,
  UserPlus,
  Users,
  Lightbulb,
  CheckSquare,
  LineChart,
  Zap,
  MessageSquare,
  Info,
  HelpCircle,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import TaskModal from "@/components/task-modal";
import OKRFormModal from "@/components/okr-form-modal";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function DailyFocusPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // State for modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  // Queries
  const priorityTasksQuery = useQuery({
    queryKey: [`/api/users/${userId}/tasks`],
    enabled: !!userId,
  });

  const gamificationQuery = useQuery({
    queryKey: [`/api/gamification/stats/${userId}`],
    enabled: !!userId,
  });

  // Handlers
  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Focus</h1>
            <p className="text-gray-600 mt-1">
              Fokus pada task prioritas dan pantau kemajuan harian Anda
            </p>
          </div>
          <Button
            onClick={() => setIsGoalModalOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Goal
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-600" />
            Progress Harian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {priorityTasksQuery.data?.filter((task: any) => task.status === 'completed').length || 0}
              </div>
              <div className="text-sm text-gray-600">Task Selesai</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {priorityTasksQuery.data?.filter((task: any) => task.status === 'in_progress').length || 0}
              </div>
              <div className="text-sm text-gray-600">Task Sedang Berjalan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {priorityTasksQuery.data?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Task</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Task Prioritas</TabsTrigger>
          <TabsTrigger value="progress">Update Progress</TabsTrigger>
          <TabsTrigger value="initiatives">Kelola Inisiatif</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">Task Prioritas Hari Ini</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Fokus pada task yang perlu diselesaikan hari ini
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto flex-shrink-0"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Tambah Task</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priorityTasksQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : priorityTasksQuery.data?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada task untuk hari ini
                </div>
              ) : (
                <div className="space-y-3">
                  {priorityTasksQuery.data?.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                          {task.priority === 'high' ? 'Tinggi' : 'Sedang'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Update Progress Harian</CardTitle>
              <CardDescription className="text-sm">
                Lacak kemajuan goals dan inisiatif Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Progress tracking akan segera hadir...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Inisiatif Aktif</CardTitle>
              <CardDescription className="text-sm">
                Kelola dan monitor inisiatif strategis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manajemen inisiatif akan segera hadir...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Goal Creation Modal */}
      <OKRFormModal
        open={isGoalModalOpen}
        onOpenChange={setIsGoalModalOpen}
      />

      {/* Task Modal */}
      <TaskModal
        open={isTaskModalOpen}
        onClose={handleTaskModalClose}
        task={selectedTask}
      />
    </div>
  );
}