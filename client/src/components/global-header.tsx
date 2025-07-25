import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  Bell,
  Settings,
  User,
  LogOut,
  FileText,
  Target,
  Calendar,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import GoalFormModal from "./goal-form-modal";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useLogout";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const taskFormSchema = z.object({
  initiativeId: z.string().min(1, "Rencana harus dipilih"),
  title: z.string().min(1, "Judul task harus diisi"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().optional(),
});

export default function GlobalHeader({
  onMenuToggle,
  sidebarOpen,
  sidebarCollapsed,
  onToggleCollapse,
}: GlobalHeaderProps) {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { logout } = useLogout();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Check if user is system owner
  const isSystemOwner = (user as any)?.isSystemOwner || false;

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "unassigned",
    },
  });

  // Fetch initiatives and users
  const { data: rencana } = useQuery({
    queryKey: ["/api/initiatives"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  // Check if trial status is active to determine header positioning
  const { data: trialStatus } = useQuery({
    queryKey: ["/api/trial-status"],
  });



  // Handle menu button click - mobile sidebar toggle or desktop collapse
  const handleMenuClick = () => {
    // On mobile: toggle sidebar open/close
    // On desktop: toggle sidebar collapse
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    if (isMobile && onMenuToggle) {
      onMenuToggle();
    } else if (!isMobile && onToggleCollapse) {
      onToggleCollapse();
    }
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: z.infer<typeof taskFormSchema>) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task berhasil dibuat",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      setShowTaskModal(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Gagal membuat task",
        variant: "destructive",
      });
    },
  });



  const handleTaskSubmit = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data);
  };

  const getUserInitials = () => {
    const name = (user as any)?.name || "";
    if (name && name.trim() !== '') {
      const nameParts = name.trim().split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email[0].toUpperCase();
    }
    return "U";
  };

  // Global keyboard shortcut for creating Goal (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsGoalModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Get current location for onboarding page detection
  const [location] = useLocation();
  const isOnboardingPage = location === "/onboarding" || location === "/guided-onboarding" || location === "/company-onboarding";
  
  // Calculate header position based on trial status (excluding system owners) and onboarding state
  const hasTrialStatus = trialStatus?.isTrialActive && !(user as any)?.isSystemOwner && !isOnboardingPage;
  const headerTop = hasTrialStatus ? '44px' : '0px';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed left-0 right-0 z-40" style={{ top: headerTop }}>
      {/* Left side - Menu toggle and Logo */}
      <div className="flex items-center space-x-3">
        {/* Sidebar toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMenuClick}
          className="hover:bg-gray-100"
          data-tour="hamburger-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src="/refokus-logo.png" alt="Refokus" className="h-10 w-auto" />
        </div>
      </div>

      {/* Right side - Action buttons and notifications */}
      <div className="flex items-center space-x-3">


        {/* Notification Bell */}
        <NotificationBell />

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none rounded-lg flex items-center space-x-2"
              data-tour="user-profile"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">
                {(user as any)?.name && (user as any).name.trim() !== '' ? (user as any).name.trim() : (user as any)?.email?.split('@')[0] || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[70]">
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="flex items-center space-x-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center space-x-2 cursor-pointer text-red-600 hover:text-red-700"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Creation Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <span>Buat Task Baru</span>
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleTaskSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                {/* Initiative Selection */}
                <FormField
                  control={form.control}
                  name="initiativeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>Rencana</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih rencana" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rencana &&
                          Array.isArray(rencana) &&
                          rencana.length > 0 ? (
                            rencana
                              .filter((item: any) => item && item.id)
                              .map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.title || "Untitled Rencana"}
                                </SelectItem>
                              ))
                          ) : (
                            <div className="py-2 px-3 text-sm text-muted-foreground">
                              Tidak ada rencana tersedia
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Task Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Task</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan judul task" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date, Priority, and Assigned User */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <Flag className="h-4 w-4" />
                          <span>Prioritas</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Rendah</SelectItem>
                            <SelectItem value="medium">Sedang</SelectItem>
                            <SelectItem value="high">Tinggi</SelectItem>
                            <SelectItem value="critical">Kritis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>PIC</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "unassigned"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              Belum Ditugaskan
                            </SelectItem>
                            {Array.isArray(users) &&
                              users
                                .filter((user: any) => user?.id)
                                .map((user: any) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.firstName || ""} {user.lastName || ""}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan deskripsi task (opsional)"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTaskModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createTaskMutation.isPending ? "Membuat..." : "Buat Task"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Global Goal Creation Modal */}
      <GoalFormModal open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen} />
    </header>
  );
}
