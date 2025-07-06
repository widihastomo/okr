import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Flag,
  Target,
  User,
  Users,
  Clock,
  FileText,
  Check,
  MoreVertical,
  Edit,
  Trash2,
  Info,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TaskModal from "@/components/task-modal";
import InitiativeModal from "@/components/initiative-modal";
import { InitiativeNotes } from "@/components/initiative-notes";
import SuccessMetricsModal from "@/components/success-metrics-modal-simple";
import InitiativeClosureModal from "@/components/initiative-closure-modal";
import type { SuccessMetricWithUpdates } from "@shared/schema";

export default function InitiativeDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All state variables declared at the top level
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditInitiativeModalOpen, setIsEditInitiativeModalOpen] = useState(false);
  const [isSuccessMetricsModalOpen, setIsSuccessMetricsModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<any>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // All queries declared at the top level
  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: [`/api/initiatives/${id}`],
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/tasks`],
    enabled: !!id,
  });

  const { data: successMetrics = [] } = useQuery<any[]>({
    queryKey: [`/api/initiatives/${id}/success-metrics`],
    enabled: !!id,
  });

  const { data: relatedInitiatives } = useQuery({
    queryKey: ['/api/initiatives'],
    enabled: !!initiative,
    select: (data: any[]) => {
      const initiativeData = initiative as any;
      const keyResult = initiativeData?.keyResult;
      return data?.filter(init => 
        init.keyResultId === keyResult?.id && init.id !== id
      ) || [];
    },
  });

  // All mutations declared at the top level
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}/tasks`] });
      toast({
        title: "Berhasil",
        description: "Task berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus task",
        variant: "destructive",
      });
    },
  });

  const deleteSuccessMetricMutation = useMutation({
    mutationFn: async (metricId: string) => {
      return apiRequest("DELETE", `/api/success-metrics/${metricId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}/success-metrics`] });
      toast({
        title: "Berhasil",
        description: "Metrik keberhasilan berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus metrik keberhasilan",
        variant: "destructive",
      });
    },
  });

  const cancelInitiativeMutation = useMutation({
    mutationFn: async ({ reason }: { reason: string }) => {
      return await apiRequest("POST", `/api/initiatives/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
      setIsCancelModalOpen(false);
      setCancelReason("");
      toast({
        title: "Inisiatif dibatalkan",
        description: "Inisiatif telah dibatalkan secara permanen",
        className: "border-yellow-200 bg-yellow-50 text-yellow-800",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membatalkan inisiatif",
        description: error.message || "Terjadi kesalahan saat membatalkan inisiatif",
        variant: "destructive",
      });
    },
  });

  const handleCancelInitiative = () => {
    if (cancelReason.trim()) {
      cancelInitiativeMutation.mutate({ reason: cancelReason });
    }
  };

  // Helper function for status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { 
        label: 'Draft', 
        className: 'bg-gray-100 text-gray-800 border-gray-200' 
      },
      'sedang_berjalan': { 
        label: 'Sedang Berjalan', 
        className: 'bg-blue-100 text-blue-800 border-blue-200' 
      },
      'selesai': { 
        label: 'Selesai', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      'dibatalkan': { 
        label: 'Dibatalkan', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['draft'];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Helper function to check permissions based on status
  const canEdit = (status: string) => status === 'draft' || status === 'sedang_berjalan';
  const canClose = (status: string) => status === 'sedang_berjalan';
  const canCancel = (status: string) => status === 'draft' || status === 'sedang_berjalan';

  // Helper functions
  const calculateMetricProgress = (metric: any): number => {
    const current = Number(metric.currentValue) || 0;
    const target = Number(metric.targetValue) || 0;
    const base = Number(metric.baseValue) || 0;

    if (metric.type === "achieve_or_not") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "increase_to") {
      if (target === base) return 0;
      return Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100));
    }

    if (metric.type === "decrease_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((base - current) / (base - target)) * 100));
    }

    if (metric.type === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (metric.type === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  // Event handlers
  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus task ini?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleEditSuccessMetric = (metric: any) => {
    setEditingMetric(metric);
    setIsSuccessMetricsModalOpen(true);
  };

  const handleDeleteSuccessMetric = (metricId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus metrik keberhasilan ini?")) {
      deleteSuccessMetricMutation.mutate(metricId);
    }
  };

  // Extract data
  const initiativeData = initiative as any;
  const members = initiativeData?.members || [];
  const pic = initiativeData?.pic;
  const keyResult = initiativeData?.keyResult;

  if (initiativeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Initiative not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/dashboard?tab=initiatives';
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {initiativeData.title}
              </h1>
              {getStatusBadge(initiativeData.status)}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {canEdit(initiativeData.status) && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditInitiativeModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            
            {canClose(initiativeData.status) && (
              <Button 
                onClick={() => setIsClosureModalOpen(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Tutup Inisiatif
              </Button>
            )}
            
            {canCancel(initiativeData.status) && (
              <Button 
                variant="outline" 
                onClick={() => setIsCancelModalOpen(true)}
                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Batalkan
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {initiativeData.description}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Flag className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-medium">{initiativeData.priority}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">
                          {initiativeData.budget ? `Rp ${Number(initiativeData.budget).toLocaleString('id-ID')}` : 'Tidak ada'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-600">Mulai:</span>
                        <span className="font-medium">
                          {new Date(initiativeData.startDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="text-gray-600">Berakhir:</span>
                        <span className="font-medium">
                          {new Date(initiativeData.endDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Result Information */}
                  {keyResult && (
                    <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg mt-4">
                      <div className="flex items-center justify-between">
                        <Link href={`/key-results/${keyResult.id}`}>
                          <div className="hover:text-blue-700 transition-colors">
                            <span className="text-sm font-semibold text-blue-900">
                              Target Terkait: {keyResult.title}
                            </span>
                            <div className="text-xs text-blue-700 mt-1">
                              {keyResult.description}
                            </div>
                          </div>
                        </Link>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-900">
                            {(keyResult.progress || 0).toFixed(1)}%
                          </div>
                          <div className="text-xs text-blue-700">Progress</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          {/* Success Metrics Management Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metrik Keberhasilan
                </CardTitle>
                <Button 
                  onClick={() => {
                    setEditingMetric(null);
                    setIsSuccessMetricsModalOpen(true);
                  }}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  Tambah Metrik
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {successMetrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Belum ada metrik keberhasilan</p>
                  <p className="text-xs mt-1">Tambahkan metrik untuk mengukur pencapaian inisiatif</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {successMetrics.map((metric: any) => (
                    <div key={metric.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium text-gray-900">{metric.name}</h4>
                            <span className="text-sm text-gray-600">
                              Target: <span className="font-medium">{metric.target}</span>
                            </span>
                            <span className="text-sm text-gray-600">
                              Capaian: <span className="font-medium">{metric.achievement}</span>
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSuccessMetric(metric)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Metrik
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSuccessMetric(metric.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Metrik
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Management Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Manajemen Task
                </CardTitle>
                <Button 
                  onClick={() => setIsAddTaskModalOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                >
                  Tambah Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Belum ada task</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">
                          {task.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTask(task)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tim
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* PIC */}
              {pic && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    PIC (Person in Charge)
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {pic.firstName?.charAt(0)}{pic.lastName?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {pic.firstName} {pic.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pic.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              {members.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Anggota Tim ({members.length})
                  </div>
                  <div className="space-y-2">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {member.user?.firstName?.charAt(0)}{member.user?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user?.firstName} {member.user?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member.user?.email}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!pic && members.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Belum ada anggota tim</p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Initiative Notes */}
            <InitiativeNotes initiativeId={id!} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskModal
        open={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
        initiativeId={id!}
        isAdding={true}
      />

      <TaskModal
        open={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        task={selectedTask}
        initiativeId={id!}
        isAdding={false}
      />

      {initiative && (
        <InitiativeModal
          keyResultId={(initiative as any).keyResult?.id || ""}
          initiative={initiative}
          open={isEditInitiativeModalOpen}
          onClose={() => setIsEditInitiativeModalOpen(false)}
          onSuccess={() => {
            setIsEditInitiativeModalOpen(false);
            queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${id}`] });
          }}
        />
      )}

      <SuccessMetricsModal
        open={isSuccessMetricsModalOpen}
        onOpenChange={(open) => {
          setIsSuccessMetricsModalOpen(open);
          if (!open) {
            setEditingMetric(null);
          }
        }}
        initiativeId={id!}
        metric={editingMetric}
      />

      {initiativeData && (
        <InitiativeClosureModal
          open={isClosureModalOpen}
          onOpenChange={setIsClosureModalOpen}
          initiativeId={id!}
          initiativeTitle={initiativeData.title}
        />
      )}

      {/* Cancel Initiative Modal */}
      <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Inisiatif</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan inisiatif ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Alasan pembatalan:</Label>
            <Input
              id="cancel-reason"
              placeholder="Masukkan alasan pembatalan..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason("")}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInitiative}
              disabled={!cancelReason.trim() || cancelInitiativeMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelInitiativeMutation.isPending ? "Membatalkan..." : "Batalkan Inisiatif"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}