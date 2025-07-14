import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { AtSign, Send, Bold, Italic, Underline, List, Link } from "lucide-react";


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
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pendingLinkRange, setPendingLinkRange] = useState<Range | null>(null);

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
    mutationFn: async (commentData: { content: string; mentionedUsers: string[] }) => {
      const response = await apiRequest("POST", `/api/initiatives/${initiativeId}/comments`, commentData);
      return response.json();
    },
    onSuccess: () => {
      // Reset all form state
      setContent("");
      setMentionedUsers([]);
      setShowMentionSuggestions(false);
      setMentionQuery("");
      
      // Clear the editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/comments`] });
      toast({
        title: "Berhasil",
        description: "Komentar berhasil ditambahkan",
      });
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    },
    onError: (error) => {
      toast({
        title: "Gagal",
        description: "Gagal menambahkan komentar. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;

    if (onCommentSubmit) {
      onCommentSubmit(content);
    } else {
      createCommentMutation.mutate({ content, mentionedUsers });
    }
  }, [content, mentionedUsers, onCommentSubmit, createCommentMutation]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.innerText || "";
    setContent(text);

    // Check for mentions
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textBeforeCursor = range.startContainer.textContent?.substring(0, range.startOffset) || "";
      const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1]);
        setShowMentionSuggestions(true);
        setCursorPosition(range.startOffset);
      } else {
        setShowMentionSuggestions(false);
        setMentionQuery("");
      }
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const applyFormatting = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handleMentionSelect = useCallback((user: User) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const textContent = textNode.textContent || "";
    
    // Find the @ symbol position
    const atIndex = textContent.lastIndexOf("@", range.startOffset - 1);
    if (atIndex === -1) return;

    // Replace the mention query with the user mention
    const beforeMention = textContent.substring(0, atIndex);
    const afterMention = textContent.substring(range.startOffset);
    const mentionText = `@${user.firstName || user.email}`;
    
    textNode.textContent = beforeMention + mentionText + afterMention;
    
    // Set cursor position after the mention
    const newRange = document.createRange();
    newRange.setStart(textNode, atIndex + mentionText.length);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Add user to mentioned users
    if (!mentionedUsers.includes(user.id)) {
      setMentionedUsers([...mentionedUsers, user.id]);
    }

    setShowMentionSuggestions(false);
    setMentionQuery("");
    setContent(editorRef.current.innerText || "");
  }, [mentionedUsers]);

  const handleLinkInsert = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (selectedText) {
      setLinkText(selectedText);
      setPendingLinkRange(range);
      setShowLinkModal(true);
    } else {
      // If no text selected, insert link at cursor position
      setPendingLinkRange(range);
      setShowLinkModal(true);
    }
  }, []);

  const insertLink = useCallback(() => {
    if (!pendingLinkRange || !linkUrl) return;

    const selection = window.getSelection();
    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(pendingLinkRange);

    const linkElement = document.createElement("a");
    linkElement.href = linkUrl;
    linkElement.textContent = linkText || linkUrl;
    linkElement.style.color = "#3b82f6";
    linkElement.style.textDecoration = "underline";

    try {
      pendingLinkRange.deleteContents();
      pendingLinkRange.insertNode(linkElement);
      
      // Move cursor after the link
      const newRange = document.createRange();
      newRange.setStartAfter(linkElement);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch (error) {
      console.error("Error inserting link:", error);
    }

    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("");
    setPendingLinkRange(null);
    setContent(editorRef.current?.innerText || "");
  }, [pendingLinkRange, linkUrl, linkText]);

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const actualIsSubmitting = isSubmitting || createCommentMutation.isPending;

  return (
    <div className="relative">
      <div className="border rounded-lg p-3 bg-white">
        {/* Toolbar */}
        <div className="flex items-center gap-1 mb-2 pb-2 border-b">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("bold")}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("italic")}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("underline")}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting("insertUnorderedList")}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLinkInsert}
            className="h-8 w-8 p-0"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand("insertText", false, "@");
              }
            }}
            className="h-8 w-8 p-0"
          >
            <AtSign className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="min-h-[80px] max-h-[200px] overflow-y-auto p-2 focus:outline-none text-sm"
          style={{ 
            whiteSpace: "pre-wrap",
            wordBreak: "break-word"
          }}
          data-placeholder={placeholder}
        />

        {/* Mention Suggestions */}
        {showMentionSuggestions && filteredUsers.length > 0 && (
          <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => handleMentionSelect(user)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                  {(user.firstName || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-sm">{user.firstName || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="text-xs text-gray-500">
            Ctrl/Cmd + Enter untuk kirim
          </div>
          <div className="flex items-center gap-2">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={actualIsSubmitting}
              >
                Batal
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || actualIsSubmitting}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {actualIsSubmitting ? "Mengirim..." : submitButtonText}
            </Button>
          </div>
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && createPortal(
        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-text">Teks Link</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Masukkan teks untuk link"
                />
              </div>
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
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
              <Button onClick={insertLink} disabled={!linkUrl}>
                Tambah Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
        document.body
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}