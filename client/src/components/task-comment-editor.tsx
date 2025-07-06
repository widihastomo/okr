import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { AtSign, Send, Bold, Italic, Underline, List, Link } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskCommentEditorProps {
  taskId: string;
  onCommentAdded?: () => void;
}

export function TaskCommentEditor({ taskId, onCommentAdded }: TaskCommentEditorProps) {
  const [content, setContent] = useState("");
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFormattingMenuOpen, setIsFormattingMenuOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch users for mention suggestions
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; mentionedUsers: string[] }) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      setContent("");
      setMentionedUsers([]);
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/comments`] });
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
      onCommentAdded?.();
    },
    onError: (error: any) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal menambahkan komentar",
        variant: "destructive",
      });
    },
  });

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    
    // Check for @ mentions
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1);
      const spaceIndex = afterAt.indexOf(" ");
      const query = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex);
      
      // Show suggestions immediately when @ is typed, even with empty query
      setMentionQuery(query);
      setShowMentionSuggestions(true);
      setCursorPosition(atIndex);
      
      console.log("Mention detected:", { query, atIndex, afterAt, users: users.length });
    } else {
      setShowMentionSuggestions(false);
    }
  }, [users]);

  const handleMentionSelect = useCallback((user: User) => {
    const beforeMention = content.substring(0, cursorPosition);
    const afterMention = content.substring(cursorPosition + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${user.username}${afterMention} `;
    
    setContent(newContent);
    setMentionedUsers(prev => [...prev, user.id]);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    
    // Focus back to editor
    editorRef.current?.focus();
  }, [content, cursorPosition, mentionQuery]);

  const filteredUsers = users.filter(user => {
    if (!mentionQuery) return true; // Show all users when no query
    return user.username?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
           user.email?.toLowerCase().includes(mentionQuery.toLowerCase());
  });

  console.log("Filtered users:", { 
    totalUsers: users.length, 
    filteredCount: filteredUsers.length, 
    mentionQuery,
    showSuggestions: showMentionSuggestions 
  });

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowMentionSuggestions(false);
      }
    };

    if (showMentionSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMentionSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    createCommentMutation.mutate({
      content: content.trim(),
      mentionedUsers,
    });
  };

  const applyFormatting = (format: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) return;

    let formattedText = selectedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
    }

    range.deleteContents();
    range.insertNode(document.createTextNode(formattedText));
    selection.removeAllRanges();
    
    // Update content state
    if (editorRef.current) {
      setContent(editorRef.current.textContent || "");
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          {/* Formatting toolbar */}
          <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFormattingMenuOpen(!isFormattingMenuOpen)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <Bold size={14} />
              Format
            </button>
            
            <AnimatePresence>
              {isFormattingMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-1 ml-2"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex-1" />
            
            <button
              type="button"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <AtSign size={14} />
              @ untuk mention
            </button>
          </div>

          {/* Content editor */}
          <div className="relative overflow-visible">
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => handleContentChange(e.currentTarget.textContent || "")}
              className="min-h-[120px] p-4 outline-none resize-none text-sm leading-relaxed"
              placeholder="Tulis komentar... Gunakan @ untuk mention user"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              data-placeholder="Tulis komentar... Gunakan @ untuk mention user"
            />
            
            {/* Debug dropdown position */}
            {showMentionSuggestions && (
              <div 
                className="bg-red-500 text-white p-4 rounded"
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 99999,
                  width: '300px',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}
              >
                <div className="font-bold mb-2">MENTION DROPDOWN ACTIVE</div>
                <div className="text-sm mb-2">Query: "{mentionQuery}"</div>
                <div className="text-sm mb-2">Total Users: {users.length}</div>
                <div className="text-sm mb-4">Filtered: {filteredUsers.length}</div>
                
                <div className="bg-white text-black rounded p-2">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleMentionSelect(user)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-200 flex items-center gap-2 text-sm border-b last:border-b-0"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                          {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{user.username}</div>
                          <div className="text-xs text-gray-600">{user.email}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Tidak ada user yang cocok
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setContent("");
              setMentionedUsers([]);
              if (editorRef.current) {
                editorRef.current.textContent = "";
              }
            }}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={!content.trim() || createCommentMutation.isPending}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
          >
            {createCommentMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Mengirim...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send size={16} />
                Kirim Komentar
              </div>
            )}
          </Button>
        </div>
      </form>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}