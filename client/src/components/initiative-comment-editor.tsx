import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Bold, Italic, Underline, Link, AtSign, Send } from "lucide-react";

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
  isEditing?: boolean;
  onSave?: (content: string) => void;
  parentId?: string; // For reply functionality
  disabled?: boolean;
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
  onCancel,
  isEditing = false,
  onSave,
  parentId,
  disabled = false
}: InitiativeCommentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [isActive, setIsActive] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Set initial content when initialContent prop changes
  useEffect(() => {
    if (initialContent && editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Fetch users for mention suggestions
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; mentionedUsers: string[]; parentId?: string }) => {
      const response = await apiRequest("POST", `/api/initiatives/${initiativeId}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      // Reset all form state
      setContent("");
      setMentionedUsers([]);
      setShowMentionSuggestions(false);
      setMentionQuery("");
      
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      
      // Invalidate comments cache
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      toast({
        title: "Komentar berhasil ditambahkan",
        description: "Komentar Anda telah berhasil disimpan.",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast({
        title: "Gagal menambahkan komentar",
        description: "Terjadi kesalahan saat menyimpan komentar.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    // Handle editing mode
    if (isEditing && onSave) {
      onSave(content);
      return;
    }

    // Handle custom submit function
    if (onCommentSubmit) {
      onCommentSubmit(content);
      return;
    }

    // Default submit behavior
    createCommentMutation.mutate({ content, mentionedUsers, parentId });
  }, [content, mentionedUsers, onCommentSubmit, createCommentMutation, isEditing, onSave, parentId]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Check for @ mentions
    const mentionMatches = newContent.match(/@(\w+)/g);
    if (mentionMatches) {
      const lastMention = mentionMatches[mentionMatches.length - 1];
      const query = lastMention.slice(1); // Remove @
      setMentionQuery(query);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
      setMentionQuery("");
    }
  }, []);

  const handleMentionSelect = useCallback((user: User) => {
    if (!editorRef.current) return;
    
    const currentContent = editorRef.current.innerHTML;
    const updatedContent = currentContent.replace(
      new RegExp(`@${mentionQuery}$`),
      `@${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Unknown User"}`
    );
    
    editorRef.current.innerHTML = updatedContent;
    setContent(updatedContent);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    
    // Add to mentioned users if not already there
    if (!mentionedUsers.includes(user.id)) {
      setMentionedUsers([...mentionedUsers, user.id]);
    }
  }, [mentionQuery, mentionedUsers]);

  const applyFormatting = useCallback((command: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    switch (command) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
        break;
    }
    
    // Update content after formatting
    setContent(editorRef.current.innerHTML);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const filteredUsers = users.filter(user => 
    mentionQuery && (
      (user.firstName && user.firstName.toLowerCase().includes(mentionQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(mentionQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(mentionQuery.toLowerCase())
    )
  );

  console.log('Filtered users:', {
    totalUsers: users.length,
    filteredCount: filteredUsers.length,
    mentionQuery,
    showSuggestions: showMentionSuggestions
  });

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyFormatting('bold')}
                className="p-1 rounded hover:bg-gray-200"
                title="Bold"
              >
                <Bold size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('italic')}
                className="p-1 rounded hover:bg-gray-200"
                title="Italic"
              >
                <Italic size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('underline')}
                className="p-1 rounded hover:bg-gray-200"
                title="Underline"
              >
                <Underline size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('link')}
                className="p-1 rounded hover:bg-gray-200"
                title="Link"
              >
                <Link size={14} />
              </button>
            </div>
            
            <div className="flex-1" />
            
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <AtSign size={14} />
              @ untuk mention
            </span>
          </div>

          {/* Content editor */}
          <div className="relative">
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => handleContentChange(e.currentTarget.innerHTML || "")}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsActive(true)}
              onBlur={() => setIsActive(false)}
              className="min-h-[120px] p-4 outline-none resize-none text-sm leading-relaxed"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              data-placeholder={placeholder}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          {showCancelButton && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setContent("");
                setMentionedUsers([]);
                if (editorRef.current) {
                  editorRef.current.innerHTML = "";
                }
                if (onCancel) {
                  onCancel();
                }
              }}
            >
              Batal
            </Button>
          )}
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting || createCommentMutation.isPending || disabled}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            {(isSubmitting || createCommentMutation.isPending) ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                {submitButtonText.includes("...") ? submitButtonText : (isEditing ? "Menyimpan..." : "Mengirim...")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send size={16} />
                {isEditing ? "Simpan" : submitButtonText}
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Mention suggestions dropdown - positioned above form */}
      {showMentionSuggestions && (
        <div 
          className="absolute bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
          style={{
            width: '100%',
            bottom: '100%',
            marginBottom: '8px',
            left: '0'
          }}
        >
          {filteredUsers.length > 0 ? (
            <div>
              {filteredUsers.slice(0, 5).map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMentionSelect(user);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                    {(user.firstName || user.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.firstName || user.email}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              Tidak ada user yang cocok
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `
      }} />
    </div>
  );
}