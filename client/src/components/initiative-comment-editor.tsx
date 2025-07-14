import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Send } from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string }) => {
      const response = await apiRequest("POST", `/api/initiatives/${initiativeId}/notes`, {
        ...commentData,
        type: "update", // Set type as update for general comments
        title: "Komentar", // Default title for comments
      });
      return response.json();
    },
    onSuccess: () => {
      setContent("");
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

  const handleSubmit = useCallback(() => {
    if (!content.trim()) return;
    
    if (onCommentSubmit) {
      onCommentSubmit(content);
    } else {
      createCommentMutation.mutate({ content });
    }
  }, [content, onCommentSubmit, createCommentMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setContent(textarea.value);
    
    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isSubmitting || createCommentMutation.isPending}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Ctrl + Enter untuk mengirim
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
    </div>
  );
}