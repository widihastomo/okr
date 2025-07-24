import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  FileText,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Lightbulb,
  ListTodo,
  Settings,
  Eye,
  Building2,
  CheckCircle,
  Clock,
  Flag,
  MoreVertical,
  Copy,
  Download,
  Share2,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Template Key Result Type Options
const templateKeyResultTypes = [
  {
    value: "increase_to",
    label: "Naik ke Target",
    icon: TrendingUp,
    color: "text-green-600 border-green-200 bg-green-50"
  },
  {
    value: "decrease_to", 
    label: "Turun ke Target",
    icon: TrendingDown,
    color: "text-red-600 border-red-200 bg-red-50"
  },
  {
    value: "achieve_or_not",
    label: "Dicapai/Tidak",
    icon: Target,
    color: "text-blue-600 border-blue-200 bg-blue-50"
  },
  {
    value: "should_stay_above",
    label: "Tetap di Atas",
    icon: Plus,
    color: "text-emerald-600 border-emerald-200 bg-emerald-50"
  },
  {
    value: "should_stay_below",
    label: "Tetap di Bawah", 
    icon: TrendingDown,
    color: "text-amber-600 border-amber-200 bg-amber-50"
  }
];

// UI Components
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyResultModal } from "@/components/goal-form-modal";

const focusAreaOptions = [
  { value: "penjualan", label: "Tingkatkan Pendapatan", icon: TrendingUp, color: "bg-green-100 text-green-800" },
  { value: "operasional", label: "Rapikan Operasional", icon: Settings, color: "bg-blue-100 text-blue-800" },
  { value: "customer_service", label: "Kembangkan Tim", icon: Users, color: "bg-purple-100 text-purple-800" },
  { value: "marketing", label: "Ekspansi Bisnis", icon: Target, color: "bg-orange-100 text-orange-800" }
];

// Template Overview Card Component
function TemplateOverviewCard({ template }: { template: any }) {
  const focusArea = focusAreaOptions.find(f => f.value === template.focusAreaTag);
  const FocusIcon = focusArea?.icon || Target;

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">{template.title}</CardTitle>
              <Badge className={focusArea?.color || "bg-gray-100 text-gray-800"}>
                <FocusIcon className="w-3 h-3 mr-1" />
                {focusArea?.label || template.focusAreaTag}
              </Badge>
            </div>
            <CardDescription className="text-base">
              {template.description || "Tidak ada deskripsi tersedia"}
            </CardDescription>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Export Template
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-gray-600">Angka Target: {template.keyResults?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-gray-600">Inisiatif: {template.initiatives?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ListTodo className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-600">Tugas: {template.tasks?.length || 0}</span>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Tipe Template:</span>
              <Badge variant={template.organizationId ? "secondary" : "default"}>
                {template.organizationId ? "Custom" : "System"}
              </Badge>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Dibuat:</span>
              <span className="text-gray-600">
                {template.createdAt ? format(new Date(template.createdAt), "dd MMM yyyy", { locale: id }) : "-"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Key Results Card Component
function KeyResultsCard({ 
  keyResults, 
  onAddKeyResult, 
  onEditKeyResult, 
  onDeleteKeyResult 
}: { 
  keyResults: any[], 
  onAddKeyResult: () => void,
  onEditKeyResult: (keyResult: any, index: number) => void,
  onDeleteKeyResult: (index: number) => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Angka Target ({keyResults?.length || 0})
            </CardTitle>
            <CardDescription>
              Target ukuran yang akan dicapai dalam template ini
            </CardDescription>
          </div>
          <Button onClick={onAddKeyResult} size="sm" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Angka Target
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {keyResults && keyResults.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul & Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Baseline</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keyResults.map((kr: any, index: number) => {
                  const krType = templateKeyResultTypes.find(t => t.value === kr.keyResultType);
                  const TypeIcon = krType?.icon || Target;
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{kr.title}</div>
                          {kr.description && (
                            <div className="text-sm text-gray-600 mt-1">{kr.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={krType?.color}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {krType?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{kr.baseValue || "0"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{kr.targetValue || "0"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{kr.unit || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditKeyResult(kr, index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteKeyResult(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada angka target yang didefinisikan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Initiatives Card Component
function InitiativesCard({ initiatives, onAddInitiative }: { initiatives: any[], onAddInitiative: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-orange-600" />
              Inisiatif ({initiatives?.length || 0})
            </CardTitle>
            <CardDescription>
              Strategi dan program yang akan dijalankan
            </CardDescription>
          </div>
          <Button onClick={onAddInitiative} size="sm" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Inisiatif
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {initiatives && initiatives.length > 0 ? (
          <div className="space-y-4">
            {initiatives.map((initiative: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{initiative.title}</h4>
                {initiative.description && (
                  <p className="text-sm text-gray-600">{initiative.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada inisiatif yang didefinisikan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Tasks Card Component
function TasksCard({ tasks, onAddTask }: { tasks: any[], onAddTask: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-purple-600" />
              Tugas ({tasks?.length || 0})
            </CardTitle>
            <CardDescription>
              Task operasional yang perlu dikerjakan
            </CardDescription>
          </div>
          <Button onClick={onAddTask} size="sm" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Tugas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks && tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{task.title}</h4>
                {task.description && (
                  <p className="text-sm text-gray-600">{task.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ListTodo className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada tugas yang didefinisikan</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TemplateDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Modal states for adding components
  const [isAddKeyResultModalOpen, setIsAddKeyResultModalOpen] = useState(false);
  const [isAddInitiativeModalOpen, setIsAddInitiativeModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  
  // Modal states for editing/deleting key results
  const [isEditKeyResultModalOpen, setIsEditKeyResultModalOpen] = useState(false);
  const [keyResultToEdit, setKeyResultToEdit] = useState<any>(null);
  const [keyResultEditIndex, setKeyResultEditIndex] = useState<number>(-1);
  const [deleteKeyResultDialogOpen, setDeleteKeyResultDialogOpen] = useState(false);
  const [keyResultToDelete, setKeyResultToDelete] = useState<number>(-1);
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: ""
  });

  const [newInitiative, setNewInitiative] = useState({
    title: "",
    description: ""
  });

  // Fetch template details
  const { data: template, isLoading } = useQuery({
    queryKey: [`/api/goal-templates/single/${id}`],
    enabled: !!id,
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/goal-templates/${id}`),
    onSuccess: () => {
      toast({
        title: "Template Dihapus",
        description: "Template berhasil dihapus dari sistem",
        variant: "default"
      });
      setLocation("/template-management");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus template",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("🚀 Mutation starting with data:", data);
      console.log("📡 API URL:", `/api/goal-templates/${id}`);
      return apiRequest("PATCH", `/api/goal-templates/${id}`, data);
    },
    onSuccess: (result) => {
      console.log("✅ Mutation success:", result);
      queryClient.invalidateQueries({ queryKey: [`/api/goal-templates/single/${id}`] });
      toast({
        title: "Template Diperbarui",
        description: "Komponen berhasil ditambahkan ke template",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error("❌ Mutation error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui template",
        variant: "destructive"
      });
    }
  });

  const handleDeleteTemplate = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
  };

  // Handlers for adding components
  const handleAddKeyResult = (keyResultData: any) => {
    console.log("handleAddKeyResult called with data:", keyResultData);
    if (!template) {
      console.error("No template available");
      return;
    }
    
    // Convert KeyResultModal data to template format
    const templateKeyResult = {
      title: keyResultData.title,
      description: keyResultData.description || "",
      keyResultType: keyResultData.keyResultType,
      baseValue: keyResultData.baseValue || "0",
      targetValue: keyResultData.targetValue || "0",
      unit: keyResultData.unit || ""
    };
    
    console.log("Converted template key result:", templateKeyResult);
    console.log("Current template keyResults:", template?.keyResults);
    
    const updatedKeyResults = [...(template?.keyResults || []), templateKeyResult];
    console.log("Updated keyResults array:", updatedKeyResults);
    
    updateMutation.mutate({ keyResults: updatedKeyResults });
    
    setIsAddKeyResultModalOpen(false);
  };

  const handleAddInitiative = () => {
    if (!template) return;
    
    const updatedInitiatives = [...(template?.initiatives || []), newInitiative];
    updateMutation.mutate({ initiatives: updatedInitiatives });
    
    setNewInitiative({ title: "", description: "" });
    setIsAddInitiativeModalOpen(false);
  };

  const handleAddTask = () => {
    if (!template) return;
    
    const updatedTasks = [...(template?.tasks || []), newTask];
    updateMutation.mutate({ tasks: updatedTasks });
    
    setNewTask({ title: "", description: "" });
    setIsAddTaskModalOpen(false);
  };

  // Handlers for editing/deleting key results
  const handleEditKeyResult = (keyResult: any, index: number) => {
    // Convert template format to KeyResultModal format
    const modalKeyResult = {
      title: keyResult.title,
      description: keyResult.description || "",
      keyResultType: keyResult.keyResultType,
      baseValue: keyResult.baseValue || "0",
      targetValue: keyResult.targetValue || "0",
      currentValue: "0", // Default for template
      unit: keyResult.unit || "",
      status: "in_progress" // Default for template
    };
    
    setKeyResultToEdit(modalKeyResult);
    setKeyResultEditIndex(index);
    setIsEditKeyResultModalOpen(true);
  };

  const handleSaveEditKeyResult = (keyResultData: any) => {
    if (!template || keyResultEditIndex === -1) return;
    
    // Convert KeyResultModal data back to template format
    const templateKeyResult = {
      title: keyResultData.title,
      description: keyResultData.description || "",
      keyResultType: keyResultData.keyResultType,
      baseValue: keyResultData.baseValue || "0",
      targetValue: keyResultData.targetValue || "0",
      unit: keyResultData.unit || ""
    };
    
    const updatedKeyResults = [...(template?.keyResults || [])];
    updatedKeyResults[keyResultEditIndex] = templateKeyResult;
    
    updateMutation.mutate({ keyResults: updatedKeyResults });
    
    setIsEditKeyResultModalOpen(false);
    setKeyResultToEdit(null);
    setKeyResultEditIndex(-1);
  };

  const handleDeleteKeyResult = (index: number) => {
    setKeyResultToDelete(index);
    setDeleteKeyResultDialogOpen(true);
  };

  const confirmDeleteKeyResult = () => {
    if (!template || keyResultToDelete === -1) return;
    
    const updatedKeyResults = template.keyResults.filter((_, index) => index !== keyResultToDelete);
    updateMutation.mutate({ keyResults: updatedKeyResults });
    
    setDeleteKeyResultDialogOpen(false);
    setKeyResultToDelete(-1);
    
    toast({
      title: "Angka Target Dihapus",
      description: "Angka target berhasil dihapus dari template",
      variant: "default"
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto space-y-6 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container max-w-7xl mx-auto space-y-6 p-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Template tidak ditemukan</h3>
          <p className="text-gray-600 mb-4">Template yang Anda cari tidak ada atau sudah dihapus.</p>
          <Link href="/template-management">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Template Management
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/template-management">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detail Template</h1>
              <p className="text-gray-600">Informasi lengkap template OKR</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overview Card */}
          <TemplateOverviewCard template={template} />
          
          {/* Quick Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistik Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Angka Target</span>
                  <Badge variant="secondary">{template?.keyResults?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inisiatif</span>
                  <Badge variant="secondary">{template?.initiatives?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tugas</span>
                  <Badge variant="secondary">{template?.tasks?.length || 0}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Komponen</span>
                  <Badge className="bg-blue-600 text-white">
                    {(template?.keyResults?.length || 0) + (template?.initiatives?.length || 0) + (template?.tasks?.length || 0)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs defaultValue="key-results" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="key-results" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Angka Target
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Inisiatif
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tugas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="key-results">
            <KeyResultsCard 
              keyResults={template?.keyResults} 
              onAddKeyResult={() => setIsAddKeyResultModalOpen(true)}
              onEditKeyResult={handleEditKeyResult}
              onDeleteKeyResult={handleDeleteKeyResult}
            />
          </TabsContent>

          <TabsContent value="initiatives">
            <InitiativesCard 
              initiatives={template?.initiatives} 
              onAddInitiative={() => setIsAddInitiativeModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksCard 
              tasks={template?.tasks} 
              onAddTask={() => setIsAddTaskModalOpen(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Add Key Result Modal */}
        <KeyResultModal
          open={isAddKeyResultModalOpen}
          onOpenChange={setIsAddKeyResultModalOpen}
          onSubmit={handleAddKeyResult}
          isEditing={false}
        />

        {/* Add Initiative Modal */}
        <Dialog open={isAddInitiativeModalOpen} onOpenChange={setIsAddInitiativeModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Inisiatif</DialogTitle>
              <DialogDescription>
                Tambahkan inisiatif baru ke template ini
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="init-title">Judul Inisiatif</Label>
                <Input
                  id="init-title"
                  value={newInitiative.title}
                  onChange={(e) => setNewInitiative({ ...newInitiative, title: e.target.value })}
                  placeholder="Masukkan judul inisiatif..."
                />
              </div>
              
              <div>
                <Label htmlFor="init-description">Deskripsi</Label>
                <Textarea
                  id="init-description"
                  value={newInitiative.description}
                  onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                  placeholder="Masukkan deskripsi inisiatif..."
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddInitiativeModalOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleAddInitiative}
                disabled={!newInitiative.title || updateMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {updateMutation.isPending ? "Menambahkan..." : "Tambah Inisiatif"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Task Modal */}
        <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tambah Tugas</DialogTitle>
              <DialogDescription>
                Tambahkan tugas baru ke template ini
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Judul Tugas</Label>
                <Input
                  id="task-title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Masukkan judul tugas..."
                />
              </div>
              
              <div>
                <Label htmlFor="task-description">Deskripsi</Label>
                <Textarea
                  id="task-description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Masukkan deskripsi tugas..."
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddTaskModalOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleAddTask}
                disabled={!newTask.title || updateMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {updateMutation.isPending ? "Menambahkan..." : "Tambah Tugas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Key Result Modal */}
        <KeyResultModal
          open={isEditKeyResultModalOpen}
          onOpenChange={setIsEditKeyResultModalOpen}
          onSubmit={handleSaveEditKeyResult}
          isEditing={true}
          editingKeyResult={keyResultToEdit}
        />

        {/* Delete Key Result Confirmation Dialog */}
        <AlertDialog open={deleteKeyResultDialogOpen} onOpenChange={setDeleteKeyResultDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Angka Target</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus angka target ini dari template? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteKeyResult}
                className="bg-red-600 hover:bg-red-700"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Template Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Template</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus template "{template?.title}"? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTemplate}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}