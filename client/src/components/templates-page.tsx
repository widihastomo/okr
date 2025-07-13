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
import Sidebar from "./sidebar";
import type { Template } from "@shared/schema";

export default function TemplatesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [useTemplateModal, setUseTemplateModal] = useState<{ open: boolean; template?: Template }>({ open: false });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: () => apiRequest("GET", "/api/templates").then(res => res.json() as Promise<Template[]>)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "monthly": return Calendar;
      case "quarterly": return Target;
      case "annual": return TrendingUp;
      default: return Calendar;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "monthly": return "bg-green-100 text-green-800";
      case "quarterly": return "bg-blue-100 text-blue-800";
      case "annual": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 lg:mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Goal Templates</h1>
              <p className="text-gray-600 mt-2 text-sm lg:text-base">Create and manage reusable Goal templates</p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {templates.map((template) => {
          const TypeIcon = getTypeIcon(template.type);
          let objectives = [];
          try {
            objectives = JSON.parse(template.objectives);
          } catch (e) {
            objectives = [];
          }
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <Badge className={getTypeColor(template.type)}>
                    {template.type}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Objectives:</span>
                    <span>{objectives.length}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span>Key Results:</span>
                    <span>
                      {objectives.reduce((total: number, obj: any) => 
                        total + (obj.keyResults?.length || 0), 0
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Objectives Preview:</h4>
                  <div className="space-y-1">
                    {objectives.slice(0, 2).map((obj: any, index: number) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {obj.title}
                      </div>
                    ))}
                    {objectives.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{objectives.length - 2} more objectives
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUseTemplateModal({ open: true, template })}
                  >
                    Use Template
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first Goal template to reuse across cycles</p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      )}

      <CreateTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
        }}
      />

      <UseTemplateModal
        open={useTemplateModal.open}
        template={useTemplateModal.template}
        onOpenChange={(open: boolean) => setUseTemplateModal({ open, template: undefined })}
        onSuccess={() => {
          setUseTemplateModal({ open: false, template: undefined });
          toast({
            title: "Success",
            description: "Goals created from template successfully"
          });
        }}
      />
        </div>
      </div>
    </div>
  );
}