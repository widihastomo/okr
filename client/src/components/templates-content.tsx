import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText, Calendar, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CreateTemplateModal from "./create-template-modal";
import UseTemplateModal from "./use-template-modal";
import type { Template } from "@shared/schema";

export default function TemplatesContent() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [useTemplateModal, setUseTemplateModal] = useState<{ open: boolean; template?: Template }>({ open: false });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: () => apiRequest("GET", "/api/templates").then(res => res.json() as Promise<Template[]>)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template dihapus",
        description: "Template berhasil dihapus",
        className: "border-green-200 bg-green-50 text-green-800"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus template",
        variant: "destructive"
      });
    }
  });

  const handleUseTemplate = (template: Template) => {
    setUseTemplateModal({ open: true, template });
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus template ini?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Goal</h1>
          <p className="text-gray-600 mt-1">Template siap pakai untuk mempercepat pembuatan Goal</p>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Buat Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada template</h3>
          <p className="text-gray-500 mb-6">Buat template pertama Anda untuk mempercepat pembuatan Goal</p>
          <Button 
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Template Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description}
                </CardDescription>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Target className="h-4 w-4" />
                    <span>{template.objectives?.length || 0} Objective</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="h-4 w-4" />
                    <span>{template.keyResults?.length || 0} Angka Target</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm"
                  >
                    Gunakan Template
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <UseTemplateModal
        template={useTemplateModal.template}
        open={useTemplateModal.open}
        onOpenChange={(open) => setUseTemplateModal({ open, template: useTemplateModal.template })}
      />
    </div>
  );
}