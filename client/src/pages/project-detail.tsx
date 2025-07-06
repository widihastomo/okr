import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User,
  Download,
  Upload,
  Trash2,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Initiative, InitiativeMember, InitiativeDocument, Task, User as UserType } from "@shared/schema";

interface ProjectWithDetails extends Initiative {
  pic?: UserType;
  members: (InitiativeMember & { user: UserType })[];
  documents: (InitiativeDocument & { uploadedBy: UserType })[];
  tasks: (Task & { assignedTo?: UserType })[];
}

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
});

const memberFormSchema = z.object({
  userId: z.string().min(1, "User is required"),
  role: z.enum(["member", "lead", "reviewer"]),
});

const documentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["requirement", "design", "technical", "report", "general"]),
  fileUrl: z.string().url("Invalid URL"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const { data: project, isLoading } = useQuery<ProjectWithDetails>({
    queryKey: ["/api/initiatives", id],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateProgressMutation = useMutation({
    mutationFn: (data: { progressPercentage: number }) =>
      apiRequest(`/api/initiatives/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", id] });
      toast({
        title: "Progress Updated",
        description: "Project progress has been updated successfully.",
        variant: "success",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: z.infer<typeof taskFormSchema>) =>
      apiRequest("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          initiativeId: id,
          createdBy: "dev-user-1",
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", id] });
      setIsTaskModalOpen(false);
      toast({
        title: "Task Created",
        description: "New task has been created successfully.",
        variant: "success",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (data: z.infer<typeof memberFormSchema>) =>
      apiRequest("/api/initiative-members", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          initiativeId: id,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", id] });
      setIsMemberModalOpen(false);
      toast({
        title: "Member Added",
        description: "Team member has been added successfully.",
        variant: "success",
      });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: (data: z.infer<typeof documentFormSchema>) =>
      apiRequest("/api/initiative-documents", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          initiativeId: id,
          uploadedBy: "dev-user-1",
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", id] });
      setIsDocumentModalOpen(false);
      toast({
        title: "Document Added",
        description: "Document has been added successfully.",
        variant: "success",
      });
    },
  });

  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: "medium",
    },
  });

  const memberForm = useForm<z.infer<typeof memberFormSchema>>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      role: "member",
    },
  });

  const documentForm = useForm<z.infer<typeof documentFormSchema>>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      category: "general",
    },
  });

  const onTaskSubmit = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data);
  };

  const onMemberSubmit = (data: z.infer<typeof memberFormSchema>) => {
    addMemberMutation.mutate(data);
  };

  const onDocumentSubmit = (data: z.infer<typeof documentFormSchema>) => {
    addDocumentMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      on_hold: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Project not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation("/key-results/" + project.keyResultId)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Key Result
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-600">Project Management</p>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace("_", " ").toUpperCase()}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "No due date"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  PIC: {project.pic ? `${project.pic.firstName} ${project.pic.lastName}` : "Not assigned"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <span className="text-2xl font-bold">{project.progressPercentage}%</span>
          </CardHeader>
          <CardContent>
            <Progress value={project.progressPercentage} className="w-full" />
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                const newProgress = prompt("Enter new progress percentage (0-100):", project.progressPercentage?.toString());
                if (newProgress && !isNaN(Number(newProgress))) {
                  const progress = Math.max(0, Math.min(100, Number(newProgress)));
                  updateProgressMutation.mutate({ progressPercentage: progress });
                }
              }}
            >
              Update Progress
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{project.members.length}</div>
              <p className="text-xs text-gray-600">Total Members</p>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority.toUpperCase()} Priority
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}
          {project.objective && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Objective</h4>
              <p className="text-gray-600">{project.objective}</p>
            </div>
          )}
          {project.budget && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Budget</h4>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">Rp {Number(project.budget).toLocaleString("id-ID")}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({project.tasks.length})</TabsTrigger>
          <TabsTrigger value="members">Team ({project.members.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents ({project.documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Tasks</h3>
            <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>Add a new task to this project</DialogDescription>
                </DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4">
                    <FormField
                      control={taskForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter task title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={taskForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter task description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={taskForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={taskForm.control}
                        name="assignedTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign To</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select assignee" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName} {user.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={taskForm.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsTaskModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {project.tasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {task.assignedTo && (
                          <span>Assigned to {task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                        )}
                        {task.dueDate && (
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {project.tasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks yet. Create your first task to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>Add a new member to this project</DialogDescription>
                </DialogHeader>
                <Form {...memberForm}>
                  <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-4">
                    <FormField
                      control={memberForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select user" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.firstName} {user.lastName} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={memberForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="lead">Lead</SelectItem>
                              <SelectItem value="reviewer">Reviewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsMemberModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addMemberMutation.isPending}>
                        {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {member.user.firstName?.charAt(0)}{member.user.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{member.user.firstName} {member.user.lastName}</h4>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {project.members.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No team members yet. Add members to start collaborating.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Project Documents</h3>
            <Dialog open={isDocumentModalOpen} onOpenChange={setIsDocumentModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Document</DialogTitle>
                  <DialogDescription>Add a new document to this project</DialogDescription>
                </DialogHeader>
                <Form {...documentForm}>
                  <form onSubmit={documentForm.handleSubmit(onDocumentSubmit)} className="space-y-4">
                    <FormField
                      control={documentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter document title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={documentForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Enter document description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={documentForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="requirement">Requirement</SelectItem>
                                <SelectItem value="design">Design</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="report">Report</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={documentForm.control}
                        name="fileType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File Type</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., pdf, doc, xls" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={documentForm.control}
                      name="fileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter file name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={documentForm.control}
                      name="fileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File URL</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDocumentModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addDocumentMutation.isPending}>
                        {addDocumentMutation.isPending ? "Adding..." : "Add Document"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {project.documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {doc.title}
                      </h4>
                      {doc.description && <p className="text-sm text-gray-600">{doc.description}</p>}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {doc.category}
                      </Badge>
                      <Badge variant="outline">
                        {doc.fileType?.toUpperCase()}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a href={doc.fileUrl || "#"} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {project.documents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No documents yet. Add documents to share project resources.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}