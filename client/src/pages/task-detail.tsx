import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Send,
  FileText,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newComment, setNewComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch task details with related data
  const { data: task, isLoading } = useQuery({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: !!taskId,
  });

  // Update task status mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: { status: string }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${taskId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Task status has been updated successfully.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${(user as any)?.id}/tasks`] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation (placeholder for future implementation)
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      // This would be implemented when comments feature is added
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      setNewComment("");
      toast({
        title: "Comment Added",
        description: "Your comment has been added.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
  });

  const getUserInitials = (user: any) => {
    if (!user) return "?";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    setIsUpdating(true);
    updateTaskMutation.mutate({ status: newStatus });
    setTimeout(() => setIsUpdating(false), 500);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Task Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusIcon(task.status)}
                      <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {task.description || "No description provided."}
                    </p>
                  </div>

                  {/* Context Information */}
                  {task.initiative && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Initiative Context
                      </h4>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">{task.initiative.title}</p>
                        {task.initiative.keyResult && (
                          <p className="text-blue-600 mt-1">
                            Key Result: {task.initiative.keyResult.title}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    Comments & Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sample comments - this would be replaced with real data */}
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {getUserInitials(task.assignedUser)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">
                              {task.assignedUser ? 
                                `${task.assignedUser.firstName} ${task.assignedUser.lastName}` : 
                                "Unassigned"
                              }
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            Task created and assigned.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add new comment */}
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a comment or update..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || addCommentMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Task Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Current Status</label>
                    <Select 
                      value={task.status} 
                      onValueChange={handleStatusUpdate}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline" className={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Task Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Assigned To */}
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Assigned To</p>
                      {task.assignedUser ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-blue-600 text-white text-xs">
                              {getUserInitials(task.assignedUser)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-900">
                            {task.assignedUser.firstName} {task.assignedUser.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  {task.dueDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Due Date</p>
                        <p className="text-sm text-gray-900">
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="flex items-center gap-3">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Priority</p>
                      <p className="text-sm text-gray-900 capitalize">{task.priority}</p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Created</p>
                      <p className="text-sm text-gray-900">
                        {format(new Date(task.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.initiative?.keyResultId && (
                    <Link href={`/key-results/${task.initiative.keyResultId}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        View Key Result
                      </Button>
                    </Link>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      const newStatus = task.status === "completed" ? "in_progress" : "completed";
                      handleStatusUpdate(newStatus);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {task.status === "completed" ? "Mark as In Progress" : "Mark as Complete"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}