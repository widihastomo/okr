import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  Bell,
  Plus,
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
import OKRFormModal from "./okr-form-modal";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
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
}: GlobalHeaderProps) {
  const [notificationCount] = useState(1);
  const [isOKRModalOpen, setIsOKRModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleCreateOKR = () => {
    setIsOKRModalOpen(true);
    setIsExpanded(false);
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTaskSubmit = (data: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(data);
  };

  const getUserInitials = () => {
    const firstName = (user as any)?.firstName || "";
    const lastName = (user as any)?.lastName || "";
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email[0].toUpperCase();
    }
    return "U";
  };

  // Global keyboard shortcut for creating OKR (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setIsOKRModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      {/* Left side - Menu toggle and Logo */}
      <div className="flex items-center space-x-3">
        {/* Hamburger menu button - always visible */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-md"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img 
            src="/refokus-logo.png" 
            alt="Refokus" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Right side - Action buttons and notifications */}
      <div className="flex items-center space-x-3">
        {/* Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 hover:bg-gray-100"
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 z-[70]">
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Update progress OKR Q1</p>
                <p className="text-xs text-gray-500">2 jam yang lalu</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  Deadline key result mendekat
                </p>
                <p className="text-xs text-gray-500">1 hari yang lalu</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick Action FAB */}
        <div className="relative">
          {/* Expanded Action Buttons */}
          <div
            className={`absolute right-0 top-full mt-2 transition-all duration-300 ${
              isExpanded
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
          >
            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleCreateOKR}
                className="h-8 px-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-sm whitespace-nowrap"
              >
                <Target className="h-4 w-4 mr-1" />
                <span className="font-medium">Buat OKR</span>
              </Button>
              <Button
                onClick={handleCreateTask}
                className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white text-sm whitespace-nowrap"
              >
                <FileText className="h-4 w-4 mr-1" />
                <span className="font-medium">Buat Tugas</span>
              </Button>
            </div>
          </div>

          {/* Main FAB Button */}
          <Button
            onClick={toggleExpanded}
            className={`h-8 w-8 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
              isExpanded ? "rotate-45" : "rotate-0"
            }`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* User Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="px-2 py-1 hover:bg-blue-100 focus:bg-blue-100 focus:outline-none rounded-lg flex items-center space-x-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={(user as any)?.profileImageUrl} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 hidden md:inline">
                {(user as any)?.firstName} {(user as any)?.lastName}
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
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" }).then(
                  () => (window.location.href = "/"),
                );
              }}
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
                            {users &&
                              Array.isArray(users) &&
                              users
                                .filter((user: any) => user && user.id)
                                .map((user: any) => (
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

      {/* Global OKR Creation Modal */}
      <OKRFormModal open={isOKRModalOpen} onOpenChange={setIsOKRModalOpen} />
    </header>
  );
}
