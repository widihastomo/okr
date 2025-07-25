import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Filter, FileText, Target, TrendingUp, TrendingDown, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  focusAreaTag: string;
  category: string;
  keyResults: Array<{
    title: string;
    description?: string;
    keyResultType: string;
    baseline?: number;
    target?: number;
    targetValue?: string;
    unit: string;
  }>;
  initiatives: Array<{
    title: string;
    description: string;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    priority?: string;
    dueDate?: string;
  }>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "sales", label: "Sales / Penjualan" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operasional" },
  { value: "hr", label: "Human Resources" },
  { value: "finance", label: "Finance / Keuangan" },
  { value: "it", label: "IT / Technology" },
  { value: "customer_service", label: "Customer Service" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "ceo", label: "CEO / Executive" },
  { value: "cfo", label: "CFO / Financial" },
  { value: "general", label: "General / Umum" }
];

const focusAreaOptions = [
  { value: "all", label: "Semua Area" },
  { value: "penjualan", label: "Penjualan" },
  { value: "marketing", label: "Marketing" },
  { value: "operasional", label: "Operasional" },
  { value: "customer_service", label: "Customer Service" }
];

// Get type-specific icon for key results
const getKeyResultTypeIcon = (type: string) => {
  switch (type) {
    case "increase_to":
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    case "decrease_to":
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    case "achieve_or_not":
      return <Target className="w-4 h-4 text-blue-600" />;
    case "should_stay_above":
      return <Plus className="w-4 h-4 text-emerald-600" />;
    case "should_stay_below":
      return <Minus className="w-4 h-4 text-amber-600" />;
    default:
      return <Target className="w-4 h-4 text-gray-600" />;
  }
};

// Get focus area color theme
const getFocusAreaTheme = (focusArea: string) => {
  switch (focusArea) {
    case "penjualan":
      return "from-green-500 to-emerald-500";
    case "marketing":
      return "from-blue-500 to-cyan-500";
    case "operasional":
      return "from-orange-500 to-amber-500";
    case "customer_service":
      return "from-purple-500 to-indigo-500";
    default:
      return "from-gray-500 to-slate-500";
  }
};

export default function ClientTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [focusAreaFilter, setFocusAreaFilter] = useState<string>("all");
  const [isUseTemplateModalOpen, setIsUseTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");

  // Fetch goal templates from database
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/goal-templates/all"],
    queryFn: () => apiRequest("GET", "/api/goal-templates/all").then(res => res.json()) as Promise<GoalTemplate[]>
  });

  // Fetch cycles for template usage
  const { data: cycles = [] } = useQuery({
    queryKey: ["/api/cycles"],
    queryFn: () => apiRequest("GET", "/api/cycles").then(res => res.json())
  });

  // Use template mutation
  const useTemplateMutation = useMutation({
    mutationFn: async ({ templateId, cycleId }: { templateId: string; cycleId: string }) => {
      const response = await apiRequest("POST", `/api/goal-templates/${templateId}/use`, { cycleId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template berhasil digunakan",
        description: "Template goal telah diterapkan ke organisasi Anda",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/okrs"] });
      setIsUseTemplateModalOpen(false);
      setSelectedTemplate(null);
      setSelectedCycleId("");
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menggunakan template",
        description: error.message || "Terjadi kesalahan saat menerapkan template",
        variant: "destructive",
      });
    },
  });

  const handleUseTemplate = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setIsUseTemplateModalOpen(true);
  };

  const handleConfirmUseTemplate = () => {
    if (!selectedTemplate || !selectedCycleId) {
      toast({
        title: "Pilih siklus terlebih dahulu",
        description: "Harap pilih siklus untuk menerapkan template",
        variant: "destructive",
      });
      return;
    }
    
    useTemplateMutation.mutate({
      templateId: selectedTemplate.id,
      cycleId: selectedCycleId
    });
  };

  // Filter templates based on selected filters
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    const matchesFocusArea = focusAreaFilter === "all" || template.focusAreaTag === focusAreaFilter;
    return matchesCategory && matchesFocusArea;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Goals</h1>
        <p className="text-gray-600">
          Pilih template goal yang sesuai dengan kebutuhan departemen dan fokus bisnis Anda
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={focusAreaFilter} onValueChange={setFocusAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Area Fokus" />
              </SelectTrigger>
              <SelectContent>
                {focusAreaOptions.map((focusArea) => (
                  <SelectItem key={focusArea.value} value={focusArea.value}>
                    {focusArea.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Menampilkan {filteredTemplates.length} template dari {templates.length} total template
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada template ditemukan</h3>
          <p className="text-gray-600">
            Coba ubah filter pencarian untuk menemukan template yang sesuai
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {template.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3">
                  <Badge 
                    className={`bg-gradient-to-r ${getFocusAreaTheme(template.focusAreaTag)} text-white`}
                  >
                    {template.focusAreaTag.charAt(0).toUpperCase() + template.focusAreaTag.slice(1)}
                  </Badge>
                  
                  {template.initiatives && template.initiatives.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {template.initiatives.length} Inisiatif
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Key Results */}
                {template.keyResults && template.keyResults.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Angka Target ({template.keyResults.length})
                    </h4>
                    <div className="space-y-2">
                      {template.keyResults.slice(0, 3).map((kr, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          {getKeyResultTypeIcon(kr.keyResultType)}
                          <span className="text-gray-600 line-clamp-1">
                            {kr.title} {kr.targetValue || kr.target} {kr.unit}
                          </span>
                        </div>
                      ))}
                      {template.keyResults.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.keyResults.length - 3} angka target lainnya
                        </div>
                      )}
                    </div>
                  </div>
                )}



                {/* Use Template Button */}
                <div className="pt-3 border-t">
                  <Button 
                    onClick={() => handleUseTemplate(template)}
                    disabled={useTemplateMutation.isPending}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
                  >
                    {useTemplateMutation.isPending ? "Menerapkan..." : "Gunakan Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Use Template Modal */}
      <Dialog open={isUseTemplateModalOpen} onOpenChange={setIsUseTemplateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gunakan Template Goal</DialogTitle>
            <DialogDescription>
              Pilih siklus untuk menerapkan template "{selectedTemplate?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Pilih Siklus
              </label>
              <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siklus untuk template" />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((cycle: any) => (
                    <SelectItem key={cycle.id} value={cycle.id}>
                      {cycle.name} ({cycle.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUseTemplateModalOpen(false)}
              disabled={useTemplateMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmUseTemplate}
              disabled={useTemplateMutation.isPending || !selectedCycleId}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {useTemplateMutation.isPending ? "Menerapkan..." : "Gunakan Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}