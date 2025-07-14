import { useState } from "react";
import { Bell, Settings, Check, Trash2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useNotifications } from "./notification-provider";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type Notification, type User } from "@shared/schema";

export function NotificationBell() {
  const { notifications, unreadCount, refetchNotifications, refetchUnreadCount } = useNotifications();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/notifications/mark-all-read");
      return response.json();
    },
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
      toast({
        title: "Berhasil",
        description: "Semua notifikasi telah ditandai sudah dibaca",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("DELETE", `/api/notifications/${notificationId}`);
      return response.json();
    },
    onSuccess: () => {
      refetchNotifications();
      refetchUnreadCount();
      toast({
        title: "Berhasil",
        description: "Notifikasi telah dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    },
  });

  const handleNotificationClick = (notification: Notification & { actor?: User }) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationLink = (notification: Notification & { actor?: User }) => {
    switch (notification.entityType) {
      case 'task':
        return `/tasks/${notification.entityId}`;
      case 'objective':
        return `/objectives/${notification.entityId}`;
      case 'key_result':
        return `/key-results/${notification.entityId}`;
      case 'initiative':
        return `/initiatives/${notification.entityId}`;
      case 'team':
        return `/teams/${notification.entityId}`;
      default:
        return null;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'task_status_changed':
      case 'task_due_date_changed':
        return '📋';
      case 'comment_added':
        return '💬';
      case 'user_mentioned':
        return '👤';
      case 'objective_created':
      case 'objective_status_changed':
        return '🎯';
      case 'key_result_updated':
        return '📊';
      case 'initiative_created':
      case 'initiative_status_changed':
        return '🚀';
      case 'added_to_team':
      case 'role_changed':
        return '👥';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-auto p-1 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Tandai Semua
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const NotificationContent = (
                <div 
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0",
                    !notification.isRead && "bg-blue-50/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="text-lg flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium leading-tight",
                          !notification.isRead && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">
                          {notification.message}
                        </p>
                        {notification.entityTitle && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            {notification.entityTitle}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {link && (
                          <Link href={link}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {notification.actor && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {notification.actor.firstName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">
                              {notification.actor.firstName && notification.actor.lastName 
                                ? `${notification.actor.firstName} ${notification.actor.lastName}` 
                                : "Unknown User"}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { 
                          addSuffix: true, 
                          locale: id 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );

              return (
                <div key={notification.id}>
                  {NotificationContent}
                </div>
              );
            })
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-sm" asChild>
              <Link href="/notification-settings">
                <Settings className="h-4 w-4 mr-2" />
                Pengaturan Notifikasi
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}