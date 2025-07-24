import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, Edit, Trash2, Target, TrendingUp, TrendingDown, 
  Lightbulb, ListTodo, Settings, Eye, Users 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const focusAreaOptions = [
  { value: "penjualan", label: "Tingkatkan Pendapatan", icon: TrendingUp, color: "bg-green-100 text-green-800" },
  { value: "operasional", label: "Rapikan Operasional", icon: Settings, color: "bg-blue-100 text-blue-800" },
  { value: "customer_service", label: "Kembangkan Tim", icon: Users, color: "bg-purple-100 text-purple-800" },
  { value: "marketing", label: "Ekspansi Bisnis", icon: Target, color: "bg-orange-100 text-orange-800" }
];

const keyResultTypeOptions = [
  { value: "increase_to", label: "Meningkat ke", icon: TrendingUp },
  { value: "decrease_to", label: "Menurun ke", icon: TrendingDown },
  { value: "achieve_or_not", label: "Tercapai/Tidak", icon: Target },
  { value: "should_stay_above", label: "Tetap di atas", icon: Plus },
  { value: "should_stay_below", label: "Tetap di bawah", icon: TrendingDown }
];

interface TemplateFormData {
  title: string;
  description: string;
  focusAreaTag: string;
  keyResults: Array<{
    title: string;
    description: string;
    keyResultType: string;
    baseline: number;
    target: number;
    unit: string;
  }>;
  initiatives: Array<{
    title: string;
    description: string;
  }>;
  tasks: Array<{
    title: string;
    description: string;
  }>;
}

export default function TemplateManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    title: "",
    description: "",
    focusAreaTag: "",
    keyResults: [],
    initiatives: [],
    tasks: []
  });

  // Fetch all goal templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/goal-templates/all-system"],
    enabled: !!(user as any)?.isSystemOwner
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: TemplateFormData) => apiRequest("/api/goal-templates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-templates/all-system"] });
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Template Created",
        description: "Goal template has been created successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
        variant: "destructive"
      });
    }
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (data: TemplateFormData & { id: string }) => apiRequest(`/api/goal-templates/${data.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-templates/all-system"] });
      setIsEditModalOpen(false);
      resetForm();
      toast({
        title: "Template Updated",
        description: "Goal template has been updated successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive"
      });
    }
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/goal-templates/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goal-templates/all-system"] });
      toast({
        title: "Template Deleted",
        description: "Goal template has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete template",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      focusAreaTag: "",
      keyResults: [],
      initiatives: [],
      tasks: []
    });
    setSelectedTemplate(null);
  };

  const handleCreateTemplate = () => {
    if (!formData.title || !formData.focusAreaTag) {
      toast({
        title: "Validation Error",
        description: "Title and Focus Area are required",
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate || !formData.title || !formData.focusAreaTag) {
      toast({
        title: "Validation Error", 
        description: "Title and Focus Area are required",
        variant: "destructive"
      });
      return;
    }
    updateMutation.mutate({ ...formData, id: selectedTemplate.id });
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.title || "",
      description: template.description || "",
      focusAreaTag: template.focusAreaTag || "",
      keyResults: template.keyResults || [],
      initiatives: template.initiatives || [],
      tasks: template.tasks || []
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete template "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const addKeyResult = () => {
    setFormData({
      ...formData,
      keyResults: [...formData.keyResults, {
        title: "",
        description: "",
        keyResultType: "increase_to",
        baseline: 0,
        target: 100,
        unit: ""
      }]
    });
  };

  const removeKeyResult = (index: number) => {
    setFormData({
      ...formData,
      keyResults: formData.keyResults.filter((_, i) => i !== index)
    });
  };

  const updateKeyResult = (index: number, field: string, value: any) => {
    const updatedKeyResults = [...formData.keyResults];
    updatedKeyResults[index] = { ...updatedKeyResults[index], [field]: value };
    setFormData({ ...formData, keyResults: updatedKeyResults });
  };

  const addInitiative = () => {
    setFormData({
      ...formData,
      initiatives: [...formData.initiatives, { title: "", description: "" }]
    });
  };

  const removeInitiative = (index: number) => {
    setFormData({
      ...formData,
      initiatives: formData.initiatives.filter((_, i) => i !== index)
    });
  };

  const updateInitiative = (index: number, field: string, value: string) => {
    const updatedInitiatives = [...formData.initiatives];
    updatedInitiatives[index] = { ...updatedInitiatives[index], [field]: value };
    setFormData({ ...formData, initiatives: updatedInitiatives });
  };

  const addTask = () => {
    setFormData({
      ...formData,
      tasks: [...formData.tasks, { title: "", description: "" }]
    });
  };

  const removeTask = (index: number) => {
    setFormData({
      ...formData,
      tasks: formData.tasks.filter((_, i) => i !== index)
    });
  };

  const updateTask = (index: number, field: string, value: string) => {
    const updatedTasks = [...formData.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setFormData({ ...formData, tasks: updatedTasks });
  };

  if (!(user as any)?.isSystemOwner) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You need system owner privileges to access template management.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600">Manage goal templates for all organizations</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a new goal template that can be used across organizations
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Template Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter template title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter template description..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="focusArea">Focus Area</Label>
                  <Select value={formData.focusAreaTag} onValueChange={(value) => setFormData({ ...formData, focusAreaTag: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      {focusAreaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <option.icon className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Key Results Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Key Results</Label>
                  <Button variant="outline" size="sm" onClick={addKeyResult}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Key Result
                  </Button>
                </div>
                
                {formData.keyResults.map((kr, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Label className="text-sm font-medium">Key Result {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeKeyResult(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={kr.title}
                          onChange={(e) => updateKeyResult(index, "title", e.target.value)}
                          placeholder="Key result title..."
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={kr.keyResultType} onValueChange={(value) => updateKeyResult(index, "keyResultType", value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {keyResultTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center space-x-2">
                                  <option.icon className="w-4 h-4" />
                                  <span>{option.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Baseline</Label>
                        <Input
                          type="number"
                          value={kr.baseline}
                          onChange={(e) => updateKeyResult(index, "baseline", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Target</Label>
                        <Input
                          type="number"
                          value={kr.target}
                          onChange={(e) => updateKeyResult(index, "target", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={kr.unit}
                          onChange={(e) => updateKeyResult(index, "unit", e.target.value)}
                          placeholder="e.g., %, orang, rupiah"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          value={kr.description}
                          onChange={(e) => updateKeyResult(index, "description", e.target.value)}
                          placeholder="Key result description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Initiatives Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Initiatives</Label>
                  <Button variant="outline" size="sm" onClick={addInitiative}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Initiative
                  </Button>
                </div>
                
                {formData.initiatives.map((initiative, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Label className="text-sm font-medium">Initiative {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeInitiative(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={initiative.title}
                          onChange={(e) => updateInitiative(index, "title", e.target.value)}
                          placeholder="Initiative title..."
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={initiative.description}
                          onChange={(e) => updateInitiative(index, "description", e.target.value)}
                          placeholder="Initiative description..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Tasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Tasks</Label>
                  <Button variant="outline" size="sm" onClick={addTask}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                </div>
                
                {formData.tasks.map((task, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Label className="text-sm font-medium">Task {index + 1}</Label>
                      <Button variant="ghost" size="sm" onClick={() => removeTask(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={task.title}
                          onChange={(e) => updateTask(index, "title", e.target.value)}
                          placeholder="Task title..."
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={task.description}
                          onChange={(e) => updateTask(index, "description", e.target.value)}
                          placeholder="Task description..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateTemplate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Loading templates...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(templates) && templates.map((template: any) => {
            const focusArea = focusAreaOptions.find(f => f.value === template.focusAreaTag);
            const FocusIcon = focusArea?.icon || Target;
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                      <CardDescription className="mt-2 line-clamp-3">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <Badge className={focusArea?.color || "bg-gray-100 text-gray-800"}>
                      <FocusIcon className="w-3 h-3 mr-1" />
                      {focusArea?.label || template.focusAreaTag}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Key Results: {template.keyResults?.length || 0}</span>
                      <span>Initiatives: {template.initiatives?.length || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Tasks: {template.tasks?.length || 0}</span>
                      <span>Organization: {template.organizationId ? 'Custom' : 'System'}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id, template.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {!Array.isArray(templates) || templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 mb-4">
                <Target className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-600">
                Create your first template to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Template Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update the template information and components
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form content as create modal */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Template Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter template title..."
                />
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter template description..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-focusArea">Focus Area</Label>
                <Select value={formData.focusAreaTag} onValueChange={(value) => setFormData({ ...formData, focusAreaTag: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreaOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <option.icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Key Results, Initiatives, Tasks sections - same as create modal */}
            {/* ... (same content as create modal) ... */}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTemplate}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}