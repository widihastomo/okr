import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  Flag,
  Clock,
  Edit,
  Check,
  X,
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TaskDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch task data
  const { data: task, isLoading } = useQuery({
    queryKey: ['/api/tasks', id],
    enabled: !!id,
  });

  // Extract initiative from task data  
  const initiative = (task as any)?.initiative;

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return await apiRequest(`/api/tasks/${id}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', id] });
      toast({
        title: "Status Updated",
        description: "Task status has been updated successfully.",
        className: "border-green-200 bg-green-50 text-green-800",
      });
    },
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Tanggal tidak valid";
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "in_progress":
        return "Berlangsung";
      case "not_started":
        return "Belum Dimulai";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Tidak Diketahui";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTaskPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Tinggi";
      case "medium":
        return "Sedang";
      case "low":
        return "Rendah";
      default:
        return "Tidak Diketahui";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h1>
          <p className="text-gray-600 mb-6">The task you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const taskData = task as any;
  const isOverdue = taskData?.dueDate ? new Date(taskData.dueDate) < new Date() : false;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={initiative ? `/initiative/${initiative.id}` : "/dashboard"}>
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{taskData?.title}</h1>
              <Badge className={`${getTaskStatusColor(taskData?.status || '')} text-sm`}>
                {getTaskStatusLabel(taskData?.status || '')}
              </Badge>
            </div>
            {initiative && (
              <p className="text-gray-600">
                Initiative: <Link href={`/initiative/${initiative.id}`} className="text-blue-600 hover:underline">{initiative.title}</Link>
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle>Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {taskData?.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{taskData.description}</p>
                  </div>
                )}

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {/* Priority */}
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Priority:</span>
                      <Badge className={`${getTaskPriorityColor(taskData?.priority || '')} text-xs`}>
                        {getTaskPriorityLabel(taskData?.priority || '')}
                      </Badge>
                    </div>

                    {/* Assigned User */}
                    {taskData?.assignedUser && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Assigned to:</span>
                        <span className="text-sm font-medium">
                          {taskData.assignedUser.firstName} {taskData.assignedUser.lastName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Due Date */}
                    {taskData?.dueDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`} />
                        <span className="text-sm text-gray-600">Due Date:</span>
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                          {formatDate(taskData.dueDate)}
                          {isOverdue && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Overdue
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {/* Created Date */}
                    {taskData?.createdAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm">{formatDate(taskData.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Comments feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Update Status
                  </label>
                  <Select
                    value={taskData?.status || ''}
                    onValueChange={(status) => updateTaskStatusMutation.mutate({ status })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Belum Dimulai</SelectItem>
                      <SelectItem value="in_progress">Sedang Dikerjakan</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      // Future: Open edit modal
                      toast({
                        title: "Edit Task",
                        description: "Edit functionality coming soon",
                      });
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Status</span>
                    <Badge className={`${getTaskStatusColor(taskData?.status || '')} text-xs`}>
                      {getTaskStatusLabel(taskData?.status || '')}
                    </Badge>
                  </div>
                  
                  {taskData?.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Task Completed</span>
                    </div>
                  )}
                  
                  {taskData?.status === 'cancelled' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <X className="h-4 w-4" />
                      <span className="text-sm font-medium">Task Cancelled</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}