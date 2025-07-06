import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Calendar,
  Flag,
  TrendingUp,
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import InitiativeModal from "@/components/initiative-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import type { Initiative, KeyResult, User } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InisiatifProps {
  userFilter?: string;
  filteredKeyResultIds?: string[];
}

export default function Inisiatif({ userFilter, filteredKeyResultIds }: InisiatifProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [deletingInitiative, setDeletingInitiative] = useState<Initiative | null>(null);
  const [selectedInitiativeMembers, setSelectedInitiativeMembers] = useState<{
    initiativeId: string;
    initiativeTitle: string;
    members: any[];
  } | null>(null);
  const { toast } = useToast();

  // Fetch all inisiatif
  const { data: inisiatif = [], isLoading } = useQuery<Initiative[]>({
    queryKey: ["/api/initiatives"],
  });

  // Fetch key results to show context
  const { data: keyResults = [], isLoading: keyResultsLoading } = useQuery<
    KeyResult[]
  >({
    queryKey: ["/api/key-results"],
  });

  // Fetch initiative members data
  const { data: initiativeMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/initiative-members"],
  });

  // Fetch users data to show PIC names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Delete initiative mutation
  const deleteInitiativeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/initiatives/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiative-members"] });
      toast({
        title: "Initiative deleted",
        description: "The initiative has been deleted successfully.",
        variant: "success",
      });
      setDeletingInitiative(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete initiative. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter inisiatif based on status, priority, and user
  const filteredRencana = inisiatif.filter((initiative) => {
    const statusMatch =
      statusFilter === "all" || initiative.status === statusFilter;
    const priorityMatch =
      priorityFilter === "all" || initiative.priority === priorityFilter;

    // User filter - show initiatives where:
    // 1. No user filter applied (show all)
    // 2. User is the PIC (owner)
    // 3. User is a member of the initiative
    let userMatch = true;
    if (userFilter && userFilter !== "all" && userFilter !== "") {
      // Check if user is the PIC
      const isPIC = initiative.picId === userFilter;
      // Check if user is a member
      const members = initiativeMembers.filter(
        (m: any) => m.initiativeId === initiative.id,
      );
      const isMember = members.some((m: any) => m.userId === userFilter);

      userMatch = isPIC || isMember;
    }

    // Key Result filter - only show initiatives linked to filtered key results
    // BUT always show if user is PIC or member
    let keyResultMatch = true;
    if (filteredKeyResultIds && filteredKeyResultIds.length > 0) {
      keyResultMatch = filteredKeyResultIds.includes(initiative.keyResultId);
      
      // Override filter if user is PIC or member
      if (userFilter && userFilter !== 'all' && userFilter !== '') {
        const isPIC = initiative.picId === userFilter;
        const members = initiativeMembers.filter(
          (m: any) => m.initiativeId === initiative.id,
        );
        const isMember = members.some((m: any) => m.userId === userFilter);
        
        if (isPIC || isMember) {
          keyResultMatch = true; // Always show if user is involved
        }
      }
    }

    return statusMatch && priorityMatch && userMatch && keyResultMatch;
  });

  // Helper function to get key result title
  const getKeyResultTitle = (keyResultId: string) => {
    if (!keyResultId) return "No Key Result";
    const keyResult = keyResults.find((kr) => kr.id === keyResultId);
    return (
      keyResult?.title ||
      (keyResultsLoading ? "Loading..." : "Key Result Not Found")
    );
  };

  // Helper function to get user name
  const getUserName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  // Helper function to get initiative members
  const getInitiativeMembers = (initiativeId: string) => {
    return initiativeMembers.filter(
      (member) => member.initiativeId === initiativeId,
    );
  };

  // Helper function to show members dialog
  const handleShowMembers = (initiative: Initiative) => {
    const members = getInitiativeMembers(initiative.id);
    const memberUsers = members
      .map((member) => {
        const user = users.find((u) => u.id === member.userId);
        return user || null;
      })
      .filter(Boolean);

    setSelectedInitiativeMembers({
      initiativeId: initiative.id,
      initiativeTitle: initiative.title,
      members: memberUsers,
    });
  };

  // Helper function to get user initials
  const getUserInitials = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
      ) : filteredRencana.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tidak ada inisiatif ditemukan
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "Tidak ada inisiatif yang sesuai dengan filter Anda."
                : "Get started by creating your first initiative."}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Initiative
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRencana.map((initiative) => (
            <Card
              key={initiative.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <Badge
                      className={getStatusColor(initiative.status || "pending")}
                    >
                      {initiative.status?.replace("_", " ") || "pending"}
                    </Badge>
                    {(() => {
                      // Calculate priority level from score
                      const score = parseFloat(initiative.priorityScore || "0");
                      let level: string;
                      let color: string;
                      let label: string;
                      
                      if (score >= 4.5) {
                        level = "critical";
                        color = "bg-red-100 text-red-800";
                        label = "Kritis";
                      } else if (score >= 3.5) {
                        level = "high";
                        color = "bg-orange-100 text-orange-800";
                        label = "Tinggi";
                      } else if (score >= 2.5) {
                        level = "medium";
                        color = "bg-yellow-100 text-yellow-800";
                        label = "Sedang";
                      } else {
                        level = "low";
                        color = "bg-green-100 text-green-800";
                        label = "Rendah";
                      }
                      
                      return (
                        <div className="flex flex-col items-center">
                          <Badge className={color}>
                            {label}
                          </Badge>
                          <span className="text-xs text-gray-500 mt-1">
                            {score.toFixed(1)}/5.0
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingInitiative(initiative)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingInitiative(initiative)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg">
                  <Link href={`/initiatives/${initiative.id}`}>
                    <span className="hover:text-blue-600 cursor-pointer">
                      {initiative.title}
                    </span>
                  </Link>
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
                    <span className="font-medium">
                      {initiative.progressPercentage || 0}%
                    </span>
                  </div>
                  <Progress
                    value={initiative.progressPercentage || 0}
                    className="h-2"
                  />
                </div>

                {/* Key Result */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Key Result:</span>
                  {initiative.keyResultId ? (
                    <Link href={`/key-results/${initiative.keyResultId}`}>
                      <span className="font-medium truncate text-blue-600 hover:text-blue-800 cursor-pointer hover:underline">
                        {getKeyResultTitle(initiative.keyResultId)}
                      </span>
                    </Link>
                  ) : (
                    <span className="font-medium truncate text-gray-500">
                      No Key Result
                    </span>
                  )}
                </div>

                {/* Due Date */}
                {initiative.dueDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Due:</span>
                    <span
                      className={`font-medium ${
                        new Date(initiative.dueDate) < new Date()
                          ? "text-red-600"
                          : ""
                      }`}
                    >
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
                      {getUserName(initiative.picId)}
                    </span>
                  </div>
                )}

                {/* Budget */}
                {initiative.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">
                      Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Number(initiative.budget),
                      )}
                    </span>
                  </div>
                )}

                {/* Members */}
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Members:</span>
                    <div
                      className="flex -space-x-2 cursor-pointer"
                      onClick={() => handleShowMembers(initiative)}
                    >
                      {(() => {
                        const members = getInitiativeMembers(initiative.id);
                        const memberUsers = members
                          .slice(0, 3)
                          .map((member) => {
                            const user = users.find(
                              (u) => u.id === member.userId,
                            );
                            return user || null;
                          })
                          .filter((user): user is User => user !== null);

                        return (
                          <>
                            {memberUsers.map((user) => (
                              <Avatar
                                key={user.id}
                                className="w-8 h-8 border-2 border-white"
                              >
                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                  {getUserInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {members.length > 3 && (
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white">
                                <span className="text-xs text-gray-700">
                                  +{members.length - 3}
                                </span>
                              </div>
                            )}
                            {members.length === 0 && (
                              <div className="text-sm text-gray-500">
                                No members
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
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

      {/* Edit Initiative Modal */}
      {editingInitiative && (
        <InitiativeModal
          keyResultId={editingInitiative.keyResultId || ""}
          initiative={editingInitiative}
          onClose={() => setEditingInitiative(null)}
          onSuccess={() => setEditingInitiative(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingInitiative && (
        <DeleteConfirmationModal
          open={true}
          onOpenChange={() => setDeletingInitiative(null)}
          onConfirm={() => {
            deleteInitiativeMutation.mutate(deletingInitiative.id);
          }}
          title="Delete Initiative"
          description={`Are you sure you want to delete "${deletingInitiative.title}"? This action cannot be undone.`}
        />
      )}

      {/* Members Dialog */}
      {selectedInitiativeMembers && (
        <Dialog
          open={!!selectedInitiativeMembers}
          onOpenChange={() => setSelectedInitiativeMembers(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedInitiativeMembers.initiativeTitle} - Members
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {selectedInitiativeMembers.members.length > 0 ? (
                selectedInitiativeMembers.members.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getUserName(user.id)}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No members assigned to this initiative
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
