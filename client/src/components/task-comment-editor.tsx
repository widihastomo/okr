import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { AtSign, Send, Bold, Italic, Underline, List, Link } from "lucide-react";


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
    
    // Get cursor position from the editor
    const selection = window.getSelection();
    let currentCursorPosition = 0;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      currentCursorPosition = range.startOffset;
    }
    
    // Check for @ mentions - only at current cursor position
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1);
      const spaceIndex = afterAt.indexOf(" ");
      const query = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex);
      
      // Only show suggestions if @ is recent and we're typing after it
      const isAtCurrentPosition = currentCursorPosition >= atIndex && currentCursorPosition <= atIndex + query.length + 1;
      const hasSpaceAfterQuery = spaceIndex !== -1;
      
      if (isAtCurrentPosition && !hasSpaceAfterQuery) {
        setMentionQuery(query);
        setShowMentionSuggestions(true);
        setCursorPosition(atIndex);
        console.log("Mention detected:", { query, atIndex, afterAt, users: users.length });
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  }, [users]);

  const handleMentionSelect = useCallback((user: User) => {
    console.log("User selected:", user);
    const beforeMention = content.substring(0, cursorPosition);
    const afterMention = content.substring(cursorPosition + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${user.firstName || user.email} ${afterMention}`;
    
    console.log("New content:", newContent);
    setContent(newContent);
    setMentionedUsers(prev => [...prev, user.id]);
    setShowMentionSuggestions(false);
    setMentionQuery("");
    setCursorPosition(0);
    
    // Update editor content directly and set cursor position after the mention
    if (editorRef.current) {
      editorRef.current.innerHTML = newContent;
      editorRef.current.focus();
      
      // Set cursor position after the mention
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        const mentionEndPosition = cursorPosition + (user.firstName || user.email).length + 2; // +2 for @ and space
        range.setStart(editorRef.current.firstChild || editorRef.current, Math.min(mentionEndPosition, newContent.length));
        range.setEnd(editorRef.current.firstChild || editorRef.current, Math.min(mentionEndPosition, newContent.length));
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [content, cursorPosition, mentionQuery]);

  const filteredUsers = users.filter(user => {
    if (!mentionQuery) return true; // Show all users when no query
    return user.firstName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
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
        const url = prompt('Masukkan URL:');
        if (!url) return;
        htmlElement = document.createElement('a');
        htmlElement.textContent = selectedText;
        (htmlElement as HTMLAnchorElement).href = url;
        (htmlElement as HTMLAnchorElement).target = '_blank';
        (htmlElement as HTMLAnchorElement).className = 'text-blue-600 underline';
        break;
      default:
        return;
    }

    range.deleteContents();
    range.insertNode(htmlElement);
    
    // Add a space after the formatted element to prevent continued formatting
    const spaceNode = document.createTextNode(" ");
    range.setStartAfter(htmlElement);
    range.insertNode(spaceNode);
    
    // Position cursor after the space
    range.setStartAfter(spaceNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update content state with HTML content
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML || "");
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          {/* Formatting toolbar */}
          <div className="bg-gray-50 border-b px-3 py-2 flex items-center gap-2">
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
              className="min-h-[120px] p-4 outline-none resize-none text-sm leading-relaxed"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
              data-placeholder="Tulis komentar... Gunakan @ untuk mention user"
            />
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
                editorRef.current.innerHTML = "";
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
                    console.log("Button clicked for user:", user.firstName || user.email);
                    handleMentionSelect(user);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    textAlign: 'left',
                    backgroundColor: 'white',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                      {user.firstName || user.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Tidak ada user yang cocok dengan "{mentionQuery}"
            </div>
          )}
        </div>
      )}

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