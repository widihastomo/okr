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

const focusAreaOptions = [
  { value: "penjualan", label: "Tingkatkan Pendapatan", icon: TrendingUp, color: "bg-green-100 text-green-800" },
  { value: "operasional", label: "Rapikan Operasional", icon: Settings, color: "bg-blue-100 text-blue-800" },
  { value: "customer_service", label: "Kembangkan Tim", icon: Users, color: "bg-purple-100 text-purple-800" },
  { value: "marketing", label: "Ekspansi Bisnis", icon: Target, color: "bg-orange-100 text-orange-800" }
];

const keyResultTypeOptions = [
  { value: "increase_to", label: "Meningkat ke", icon: TrendingUp, color: "text-green-600" },
  { value: "decrease_to", label: "Menurun ke", icon: TrendingDown, color: "text-red-600" },
  { value: "achieve_or_not", label: "Tercapai/Tidak", icon: Target, color: "text-blue-600" },
  { value: "should_stay_above", label: "Tetap di atas", icon: Plus, color: "text-emerald-600" },
  { value: "should_stay_below", label: "Tetap di bawah", icon: TrendingDown, color: "text-amber-600" }
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
function KeyResultsCard({ keyResults }: { keyResults: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Angka Target ({keyResults?.length || 0})
        </CardTitle>
        <CardDescription>
          Target ukuran yang akan dicapai dalam template ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keyResults && keyResults.length > 0 ? (
          <div className="space-y-4">
            {keyResults.map((kr: any, index: number) => {
              const krType = keyResultTypeOptions.find(t => t.value === kr.keyResultType);
              const TypeIcon = krType?.icon || Target;
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{kr.title}</h4>
                      {kr.description && (
                        <p className="text-sm text-gray-600 mt-1">{kr.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={krType?.color}>
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {krType?.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Baseline:</span>
                      <div className="font-medium">{kr.baseline || 0} {kr.unit}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Target:</span>
                      <div className="font-medium">{kr.target || 0} {kr.unit}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Unit:</span>
                      <div className="font-medium">{kr.unit || "-"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
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
function InitiativesCard({ initiatives }: { initiatives: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-orange-600" />
          Inisiatif ({initiatives?.length || 0})
        </CardTitle>
        <CardDescription>
          Strategi dan program yang akan dijalankan
        </CardDescription>
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
function TasksCard({ tasks }: { tasks: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-purple-600" />
          Tugas ({tasks?.length || 0})
        </CardTitle>
        <CardDescription>
          Task operasional yang perlu dikerjakan
        </CardDescription>
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

  // Fetch template details
  const { data: template, isLoading } = useQuery({
    queryKey: [`/api/goal-templates/single/${id}`],
    enabled: !!id,
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/goal-templates/${id}`, "DELETE"),
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

  const handleDeleteTemplate = () => {
    deleteMutation.mutate();
    setDeleteDialogOpen(false);
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
                  <Badge variant="secondary">{template.keyResults?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inisiatif</span>
                  <Badge variant="secondary">{template.initiatives?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tugas</span>
                  <Badge variant="secondary">{template.tasks?.length || 0}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Komponen</span>
                  <Badge className="bg-blue-600 text-white">
                    {(template.keyResults?.length || 0) + (template.initiatives?.length || 0) + (template.tasks?.length || 0)}
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
            <KeyResultsCard keyResults={template.keyResults} />
          </TabsContent>

          <TabsContent value="initiatives">
            <InitiativesCard initiatives={template.initiatives} />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksCard tasks={template.tasks} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Template</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus template "{template.title}"? 
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