import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, InitiativeNote } from "@shared/schema";
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  User as UserIcon,
  Send,
  Bold,
  Italic,
  Underline,
  Link,
  AtSign
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Comment List Component
interface InitiativeCommentListProps {
  initiativeId: string;
}

export function InitiativeCommentList({ initiativeId }: InitiativeCommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: comments = [], isLoading } = useQuery<(InitiativeNote & { user: User })[]>({
    queryKey: [`/api/initiatives/${initiativeId}/notes`],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      const response = await apiRequest("PATCH", `/api/initiatives/${initiativeId}/notes/${commentId}`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      setEditingCommentId(null);
      setEditContent("");
      toast({
        title: "Berhasil",
        description: "Komentar berhasil diperbarui",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal memperbarui komentar",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiRequest("DELETE", `/api/initiatives/${initiativeId}/notes/${commentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      setDeleteCommentId(null);
      toast({
        title: "Berhasil",
        description: "Komentar berhasil dihapus",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menghapus komentar",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (comment: InitiativeNote & { user: User }) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editContent.trim() });
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    return user.email[0].toUpperCase();
  };

  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Belum ada komentar</p>
        <p className="text-sm text-gray-500 mt-1">
          Jadilah yang pertama memberikan komentar pada inisiatif ini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {comments.map((comment) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-3 group"
          >
            <Avatar className="w-8 h-8 mt-1">
              <AvatarFallback className="text-xs bg-orange-100 text-orange-600">
                {getInitials(comment.user)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900">
                  {getDisplayName(comment.user)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { 
                    addSuffix: true, 
                    locale: id 
                  })}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-gray-400">(diedit)</span>
                )}
              </div>
              
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[60px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Tulis komentar..."
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateComment(comment.id)}
                      disabled={!editContent.trim() || updateCommentMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {updateCommentMutation.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditContent("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div 
                    className="text-sm text-gray-700 flex-1"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                  
                  {currentUser?.id === comment.user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStartEdit(comment)}
                          className="flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteCommentId(comment.id)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <AlertDialog open={!!deleteCommentId} onOpenChange={() => setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komentar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteCommentMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Comment Editor Component
interface InitiativeCommentEditorProps {
  initiativeId: string;
  onCommentAdded?: () => void;
  onCommentSubmit?: (content: string) => void;
  initialContent?: string;
  placeholder?: string;
  submitButtonText?: string;
  isSubmitting?: boolean;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

export function InitiativeCommentEditor({ 
  initiativeId, 
  onCommentAdded, 
  onCommentSubmit,
  initialContent = "",
  placeholder = "Tulis komentar...",
  submitButtonText = "Kirim",
  isSubmitting = false,
  showCancelButton = false,
  onCancel
}: InitiativeCommentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pendingLinkRange, setPendingLinkRange] = useState<Range | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (initialContent && editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/organization/users'],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string }) => {
      const response = await apiRequest("POST", `/api/initiatives/${initiativeId}/notes`, {
        ...commentData,
        title: "Komentar",
        type: "update",
      });
      return response.json();
    },
    onSuccess: () => {
      setContent("");
      setMentionedUsers([]);
      setShowMentionSuggestions(false);
      setMentionQuery("");
      
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menambahkan komentar",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (onCommentSubmit) {
      onCommentSubmit(content.trim());
    } else {
      createCommentMutation.mutate({
        content: content.trim(),
      });
    }
  };

  const applyFormatting = (format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;

    let htmlElement: HTMLElement;
    switch (format) {
      case 'bold':
        htmlElement = document.createElement('strong');
        htmlElement.textContent = selectedText;
        break;
      case 'italic':
        htmlElement = document.createElement('em');
        htmlElement.textContent = selectedText;
        break;
      case 'underline':
        htmlElement = document.createElement('u');
        htmlElement.textContent = selectedText;
        break;
      case 'link':
        setLinkText(selectedText);
        setLinkUrl("");
        setPendingLinkRange(range.cloneRange());
        setShowLinkModal(true);
        return;
      default:
        return;
    }

    range.deleteContents();
    range.insertNode(htmlElement);
    
    const spaceNode = document.createTextNode(" ");
    range.setStartAfter(htmlElement);
    range.insertNode(spaceNode);
    
    range.setStartAfter(spaceNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML || "");
    }
  };

  const handleLinkSubmit = () => {
    if (!pendingLinkRange || !linkUrl.trim()) return;

    const htmlElement = document.createElement('a');
    htmlElement.textContent = linkText || linkUrl;
    (htmlElement as HTMLAnchorElement).href = linkUrl;
    (htmlElement as HTMLAnchorElement).target = '_blank';
    (htmlElement as HTMLAnchorElement).className = 'text-blue-600 underline';

    pendingLinkRange.deleteContents();
    pendingLinkRange.insertNode(htmlElement);
    
    const spaceNode = document.createTextNode(" ");
    pendingLinkRange.setStartAfter(htmlElement);
    pendingLinkRange.insertNode(spaceNode);
    
    pendingLinkRange.setStartAfter(spaceNode);
    pendingLinkRange.collapse(true);
    
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(pendingLinkRange);
    }
    
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML || "");
    }
    
    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("");
    setPendingLinkRange(null);
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML || "");
    }
  };

  return (
    <div className="space-y-3">
      <div className="border rounded-lg focus-within:border-gray-300">
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('link')}
            className="h-8 w-8 p-0"
          >
            <Link className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            onInput={handleEditorInput}
            className="min-h-[80px] p-3 focus:outline-none"
            data-placeholder={placeholder}
            style={{
              minHeight: '80px',
            }}
          />
          
          {content.length === 0 && (
            <div className="absolute top-0 left-0 p-3 text-gray-500 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Tekan Enter untuk baris baru
        </div>
        
        <div className="flex items-center gap-2">
          {showCancelButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting || createCommentMutation.isPending}
            >
              Batal
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting || createCommentMutation.isPending}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting || createCommentMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mengirim...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Link Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambahkan Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="linkText">Teks tampilan</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Masukkan teks yang akan ditampilkan"
              />
            </div>
            <div>
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkModal(false)}>
              Batal
            </Button>
            <Button onClick={handleLinkSubmit} className="bg-orange-600 hover:bg-orange-700">
              Tambahkan Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}