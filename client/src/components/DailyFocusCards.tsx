import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Eye, Edit, Trash2, Target, CheckCircle, Clock, Calendar, Lightbulb, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: number;
}

interface KeyResult {
  id: number;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  keyResultType: string;
  status: string;
  assignedTo?: number;
}

interface Initiative {
  id: number;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  progress: number;
  endDate: string;
  assignedToUser?: number;
  ownerId?: number;
}

interface DailyFocusCardsProps {
  // Task props
  overdueTasks: Task[];
  todayTasks: Task[];
  tomorrowTasks: Task[];
  isLoadingAllTasks: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenTaskModal: () => void;
  onToggleTaskStatus: (taskId: number, newStatus: string) => void;
  
  // Key Results props
  activeKeyResults: KeyResult[];
  isLoadingObjectives: boolean;
  onOpenCheckInModal: (keyResult: KeyResult) => void;
  
  // Initiative props
  activeInitiatives: Initiative[];
  isLoadingInitiatives: boolean;
  onUpdateMetrics: (initiative: Initiative) => void;
  
  // Common
  userFilter: string;
  formatDate: (date: Date) => string;
}

export function DailyFocusCards({
  overdueTasks,
  todayTasks,
  tomorrowTasks,
  isLoadingAllTasks,
  onEditTask,
  onDeleteTask,
  onOpenTaskModal,
  onToggleTaskStatus,
  activeKeyResults,
  isLoadingObjectives,
  onOpenCheckInModal,
  activeInitiatives,
  isLoadingInitiatives,
  onUpdateMetrics,
  userFilter,
  formatDate
}: DailyFocusCardsProps) {

  const renderTaskPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return (
      <Badge className={`text-xs ${colors[priority as keyof typeof colors] || colors.medium}`}>
        {priority === 'high' ? 'Tinggi' : priority === 'medium' ? 'Sedang' : 'Rendah'}
      </Badge>
    );
  };

  const renderTaskStatusButtons = (task: Task) => (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant={task.status === 'not_started' ? 'default' : 'outline'}
        onClick={() => onToggleTaskStatus(task.id, 'not_started')}
        className="text-xs px-2 py-1"
      >
        Belum
      </Button>
      <Button
        size="sm"
        variant={task.status === 'in_progress' ? 'default' : 'outline'}
        onClick={() => onToggleTaskStatus(task.id, 'in_progress')}
        className="text-xs px-2 py-1"
      >
        Jalan
      </Button>
      <Button
        size="sm"
        variant={task.status === 'completed' ? 'default' : 'outline'}
        onClick={() => onToggleTaskStatus(task.id, 'completed')}
        className="text-xs px-2 py-1"
      >
        Selesai
      </Button>
      <Button
        size="sm"
        variant={task.status === 'cancelled' ? 'default' : 'outline'}
        onClick={() => onToggleTaskStatus(task.id, 'cancelled')}
        className="text-xs px-2 py-1"
      >
        Batal
      </Button>
    </div>
  );

  return (
    <>
      {/* Task Prioritas and Update Progress Row */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Task Prioritas Card */}
        <div className="flex-1">
          <Card data-tour="task-prioritas">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">
                    Task Prioritas ({overdueTasks.length + todayTasks.length + tomorrowTasks.length})
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Fokus pada task yang perlu diselesaikan hari ini
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto flex-shrink-0"
                  onClick={onOpenTaskModal}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Tambah Task</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAllTasks ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overdue Tasks */}
                  {overdueTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Terlambat ({overdueTasks.length})
                      </h4>
                      {overdueTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-red-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                              {renderTaskStatusButtons(task)}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditTask(task)}>
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Today Tasks */}
                  {todayTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        Hari Ini ({todayTasks.length})
                      </h4>
                      {todayTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-blue-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                              {renderTaskStatusButtons(task)}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditTask(task)}>
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tomorrow Tasks */}
                  {tomorrowTasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Besok ({tomorrowTasks.length})
                      </h4>
                      {tomorrowTasks.map((task) => (
                        <div key={task.id} className="p-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                              <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-2 mb-2">
                                {renderTaskPriorityBadge(task.priority)}
                                <span className="text-xs text-green-600">
                                  Due: {formatDate(new Date(task.dueDate))}
                                </span>
                              </div>
                              {renderTaskStatusButtons(task)}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEditTask(task)}>
                                  <Edit className="w-3 h-3 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteTask(task)}>
                                  <Trash2 className="w-3 h-3 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Tasks */}
                  {overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm mb-2">Tidak ada task prioritas</p>
                      <p className="text-xs text-gray-400">
                        Task baru akan muncul di sini berdasarkan prioritas dan tanggal
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Update Progress Card */}
        <div className="flex-1">
          <Card data-tour="update-progress-tab">
            <CardHeader>
              <CardTitle>Update Progress Angka Target ({activeKeyResults.length})</CardTitle>
              <CardDescription>
                Lakukan check-in pada angka target (termasuk yang sudah 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingObjectives ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3 mb-2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : activeKeyResults.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {activeKeyResults
                      .filter((kr) => {
                        if (!userFilter || userFilter === 'all') return true;
                        return kr.assignedTo === userFilter;
                      })
                      .map((keyResult) => {
                        const progress = keyResult.keyResultType === 'achieve_or_not' 
                          ? (keyResult.currentValue >= keyResult.targetValue ? 100 : 0)
                          : keyResult.keyResultType === 'decrease_to'
                          ? Math.max(0, Math.min(100, ((keyResult.currentValue - keyResult.targetValue) / (keyResult.currentValue - keyResult.targetValue)) * 100))
                          : Math.max(0, Math.min(100, (keyResult.currentValue / keyResult.targetValue) * 100));

                        return (
                          <div
                            key={keyResult.id}
                            className="p-3 bg-white border border-gray-200 rounded-lg space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Link href={`/key-results/${keyResult.id}`}>
                                    <h3 className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors">
                                      {keyResult.title}
                                    </h3>
                                  </Link>
                                  <Badge
                                    className={`text-xs ${
                                      keyResult.status === 'on_track'
                                        ? 'bg-green-100 text-green-700'
                                        : keyResult.status === 'at_risk'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {keyResult.status === 'on_track'
                                      ? 'On Track'
                                      : keyResult.status === 'at_risk'
                                      ? 'At Risk'
                                      : 'Off Track'}
                                  </Badge>
                                </div>
                                <div className="w-full space-y-1">
                                  <div className="relative">
                                    <Progress value={Math.min(Math.max(progress, 0), 100)} className="h-3" />
                                    {/* Ideal target marker at 70% */}
                                    <div 
                                      className="absolute top-0 h-3 w-0.5 bg-orange-500 rounded-full" 
                                      style={{ left: '70%' }}
                                      title="Target Ideal: 70%"
                                    />
                                    <div 
                                      className="absolute -top-1 w-2 h-2 bg-orange-500 rounded-full border border-white" 
                                      style={{ left: 'calc(70% - 4px)' }}
                                      title="Target Ideal: 70%"
                                    />
                                  </div>
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{Math.round(progress)}%</span>
                                    <span className="text-orange-600 font-medium">Target: 70%</span>
                                    <span>{keyResult.currentValue} / {keyResult.targetValue} {keyResult.unit}</span>
                                  </div>
                                </div>

                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  onClick={() => onOpenCheckInModal(keyResult)}
                                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                  Check-in
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm mb-2">Belum ada angka target aktif</p>
                  <p className="text-xs text-gray-400">
                    Angka target akan muncul saat Anda membuat goals
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kelola Inisiatif Card */}
      <Card data-tour="kelola-inisiatif-tab">
        <CardHeader>
          <CardTitle>Kelola Inisiatif ({activeInitiatives.length})</CardTitle>
          <CardDescription>
            Monitor dan perbarui progress inisiatif yang sedang berjalan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingInitiatives ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-white border border-gray-200 rounded-lg">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : activeInitiatives.length > 0 ? (
            <>
              <div className="space-y-4">
                {activeInitiatives
                  .filter((initiative) => {
                    if (!userFilter || userFilter === 'all') return true;
                    return (
                      initiative.assignedToUser === userFilter ||
                      initiative.ownerId === userFilter
                    );
                  })
                  .map((initiative) => {
                    return (
                      <div
                        key={initiative.id}
                        className="p-3 bg-white border border-gray-200 rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {initiative.title}
                              </h3>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  initiative.status === 'not_started'
                                    ? 'bg-gray-100 text-gray-700'
                                    : initiative.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : initiative.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {initiative.status === 'not_started'
                                  ? 'Belum Mulai'
                                  : initiative.status === 'in_progress'
                                  ? 'Berlangsung'
                                  : initiative.status === 'completed'
                                  ? 'Selesai'
                                  : 'Dibatalkan'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              {initiative.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Due: {formatDate(new Date(initiative.endDate))}</span>
                              <span>
                                Progress: {Math.round(initiative.progress)}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {initiative.status === 'completed' ? (
                              <Button
                                disabled
                                className="bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium flex-1 mr-2"
                              >
                                Selesai
                              </Button>
                            ) : (
                              <Button
                                onClick={() => onUpdateMetrics(initiative)}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium flex-1 mr-2"
                              >
                                Update Metrics
                              </Button>
                            )}
                            <Link href={`/initiatives/${initiative.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm mb-2">Belum ada inisiatif yang aktif</p>
              <p className="text-xs text-gray-400">
                Inisiatif akan muncul saat Anda membuat goals dengan strategi implementasi
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}