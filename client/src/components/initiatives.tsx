import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Calendar, Flag, TrendingUp, Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import InitiativeModal from "@/components/initiative-modal";
import type { Initiative, KeyResult, User } from "@shared/schema";

interface InitiativesProps {
  userFilter?: string;
}

export default function Initiatives({ userFilter }: InitiativesProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch all initiatives
  const { data: initiatives = [], isLoading } = useQuery<Initiative[]>({
    queryKey: ['/api/initiatives'],
  });

  // Fetch key results to show context
  const { data: keyResults = [] } = useQuery<KeyResult[]>({
    queryKey: ['/api/key-results'],
  });

  // Fetch initiative members data
  const { data: initiativeMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/initiative-members'],
  });

  // Filter initiatives based on status, priority, and user
  const filteredInitiatives = initiatives.filter(initiative => {
    const statusMatch = statusFilter === "all" || initiative.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || initiative.priority === priorityFilter;
    
    // User filter - show initiatives where:
    // 1. No user filter applied (show all)
    // 2. User is the PIC (owner)
    // 3. User is a member of the initiative
    let userMatch = true;
    if (userFilter && userFilter !== 'all') {
      // Check if user is the PIC
      if (initiative.picId === userFilter) {
        userMatch = true;
      } else {
        // Check if user is a member
        const members = initiativeMembers.filter((m: any) => m.initiativeId === initiative.id);
        userMatch = members.some((m: any) => m.userId === userFilter);
      }
    }
    
    return statusMatch && priorityMatch && userMatch;
  });

  // Helper function to get key result title
  const getKeyResultTitle = (keyResultId: string) => {
    const keyResult = keyResults.find(kr => kr.id === keyResultId);
    return keyResult?.title || "Unknown Key Result";
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Initiative
        </Button>
      </div>

      {/* Initiatives Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInitiatives.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No initiatives found</h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "No initiatives match your current filters."
                : "Get started by creating your first initiative."}
            </p>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Initiative
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInitiatives.map((initiative) => (
            <Card key={initiative.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getStatusColor(initiative.status || "pending")}>
                    {initiative.status?.replace('_', ' ') || 'pending'}
                  </Badge>
                  <Badge className={getPriorityColor(initiative.priority || "medium")}>
                    {initiative.priority || 'medium'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  <span className="hover:text-blue-600 cursor-pointer">
                    {initiative.title}
                  </span>
                </CardTitle>
                {initiative.description && (
                  <CardDescription className="line-clamp-2">
                    {initiative.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{initiative.progressPercentage || 0}%</span>
                  </div>
                  <Progress value={initiative.progressPercentage || 0} className="h-2" />
                </div>

                {/* Key Result */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Key Result:</span>
                  <span className="font-medium truncate">
                    {getKeyResultTitle(initiative.keyResultId)}
                  </span>
                </div>

                {/* Due Date */}
                {initiative.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Due:</span>
                    <span className={`font-medium ${
                      new Date(initiative.dueDate) < new Date() ? 'text-red-600' : ''
                    }`}>
                      {format(new Date(initiative.dueDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}

                {/* PIC */}
                {initiative.picId && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">PIC:</span>
                    <span className="font-medium truncate">
                      {/* Will be populated with user data */}
                      Assigned User
                    </span>
                  </div>
                )}

                {/* Budget */}
                {initiative.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      Rp {new Intl.NumberFormat('id-ID').format(Number(initiative.budget))}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Initiative Modal */}
      {showCreateModal && (
        <InitiativeModal
          keyResultId=""
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}