import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  FileText,
  DollarSign,
  Target,
  AlertTriangle,
  Lightbulb,
  Plus,
  Edit,
  Trash2,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface InitiativeNotesProps {
  initiativeId: string;
}

// Define types for initiative notes
interface InitiativeNote {
  id: string;
  type: string;
  title: string;
  content: string;
  budgetAmount?: number;
  budgetCategory?: string;
  createdBy: string;
  createdAt: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const noteTypeConfig = {
  update: { label: "Update", icon: FileText, color: "bg-blue-100 text-blue-800" },
  budget: { label: "Budget", icon: DollarSign, color: "bg-green-100 text-green-800" },
  milestone: { label: "Milestone", icon: Target, color: "bg-purple-100 text-purple-800" },
  risk: { label: "Risk", icon: AlertTriangle, color: "bg-red-100 text-red-800" },
  decision: { label: "Decision", icon: Lightbulb, color: "bg-yellow-100 text-yellow-800" },
  general: { label: "General", icon: FileText, color: "bg-gray-100 text-gray-800" },
};

const budgetCategories = [
  { value: "development", label: "Development" },
  { value: "marketing", label: "Marketing" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "operations", label: "Operations" },
  { value: "other", label: "Other" },
];

export function InitiativeNotes({ initiativeId }: InitiativeNotesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  
  // Form state
  const [noteForm, setNoteForm] = useState({
    type: "update",
    title: "",
    content: "",
    budgetAmount: "",
    budgetCategory: "",
  });

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: [`/api/initiatives/${initiativeId}/notes`],
  });

  // Type the notes data properly
  const typedNotes = Array.isArray(notes) ? notes as InitiativeNote[] : [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest(`/api/initiatives/${initiativeId}/notes`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      toast({
        title: "Catatan berhasil ditambahkan",
        variant: "success",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Error creating note:", error);
      toast({
        title: "Gagal menambahkan catatan",
        description: error?.message || "Terjadi kesalahan yang tidak diketahui",
        variant: "destructive",
      });
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: any }) =>
      apiRequest(`/api/initiatives/${initiativeId}/notes/${noteId}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      toast({
        title: "Catatan berhasil diperbarui",
        variant: "success",
      });
      setEditingNote(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Error updating note:", error);
      toast({
        title: "Gagal memperbarui catatan",
        description: error?.message || "Terjadi kesalahan yang tidak diketahui",
        variant: "destructive",
      });
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      apiRequest(`/api/initiatives/${initiativeId}/notes/${noteId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/initiatives/${initiativeId}/notes`] });
      toast({
        title: "Catatan berhasil dihapus",
        variant: "success",
      });
      setDeleteNoteId(null);
    },
    onError: (error: any) => {
      console.error("Error deleting note:", error);
      toast({
        title: "Gagal menghapus catatan",
        description: error?.message || "Terjadi kesalahan yang tidak diketahui",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNoteForm({
      type: "update",
      title: "",
      content: "",
      budgetAmount: "",
      budgetCategory: "",
    });
  };

  const handleSubmit = () => {
    if (!noteForm.title || !noteForm.content) {
      toast({
        title: "Judul dan konten harus diisi",
        variant: "destructive",
      });
      return;
    }

    const data: any = {
      type: noteForm.type,
      title: noteForm.title,
      content: noteForm.content,
    };

    // Add budget fields if type is budget
    if (noteForm.type === "budget" && noteForm.budgetAmount) {
      data.budgetAmount = parseFloat(noteForm.budgetAmount);
      data.budgetCategory = noteForm.budgetCategory || null;
    }

    if (editingNote) {
      updateNoteMutation.mutate({ noteId: editingNote.id, data });
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handleEdit = (note: any) => {
    setNoteForm({
      type: note?.type || "update",
      title: note?.title || "",
      content: note?.content || "",
      budgetAmount: note?.budgetAmount ? note.budgetAmount.toString() : "",
      budgetCategory: note?.budgetCategory || "",
    });
    setEditingNote(note);
    setIsCreateOpen(true);
  };

  const toggleNoteExpansion = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const formatBudget = (amount: string | number | null) => {
    if (!amount) return null;
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const getUserInitials = (user: any) => {
    if (!user) return "?";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "?";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Memuat catatan...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Catatan & Update</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setEditingNote(null);
              setIsCreateOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Catatan
          </Button>
        </CardHeader>
        <CardContent>
          {typedNotes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Belum ada catatan. Tambahkan catatan pertama untuk memulai.
            </p>
          ) : (
            <div className="space-y-4">
              {typedNotes.map((note: InitiativeNote, index: number) => {
                if (!note) return null;
                const config = noteTypeConfig[note.type as keyof typeof noteTypeConfig] || noteTypeConfig.general;
                const Icon = config.icon;
                const noteId = note.id || `note-${index}`;
                const isExpanded = expandedNotes.has(noteId);
                const isOwner = user?.id === note.createdBy;

                return (
                  <div
                    key={noteId || Math.random()}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{note.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                          
                          <div className={`text-sm text-gray-600 ${!isExpanded && (note.content?.length > 200) ? 'line-clamp-3' : ''}`}>
                            {note.content}
                          </div>
                          
                          {(note.content?.length > 200) && (
                            <button
                              onClick={() => toggleNoteExpansion(noteId)}
                              className="text-blue-600 text-sm mt-1 flex items-center gap-1 hover:text-blue-700"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4" />
                                  Tampilkan lebih sedikit
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Tampilkan selengkapnya
                                </>
                              )}
                            </button>
                          )}

                          {note.type === "budget" && note.budgetAmount && (
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="font-medium">
                                {formatBudget(note.budgetAmount)}
                              </span>
                              {note.budgetCategory && (
                                <Badge variant="secondary" className="text-xs">
                                  {budgetCategories.find(c => c.value === note.budgetCategory)?.label}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                                {getUserInitials(note.createdByUser)}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {note.createdByUser?.firstName} {note.createdByUser?.lastName}
                            </span>
                            <span>•</span>
                            <span>
                              {note.createdAt && format(new Date(note.createdAt), "d MMMM yyyy HH:mm", { locale: idLocale })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(note)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteNoteId(noteId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? "Edit Catatan" : "Tambah Catatan Baru"}
            </DialogTitle>
            <DialogDescription>
              {editingNote ? "Perbarui informasi catatan initiative." : "Tambahkan catatan baru untuk initiative ini."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipe Catatan</Label>
                <Select
                  value={noteForm.type}
                  onValueChange={(value) => setNoteForm({ ...noteForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(noteTypeConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {noteForm.type === "budget" && (
                <div>
                  <Label>Kategori Budget</Label>
                  <Select
                    value={noteForm.budgetCategory}
                    onValueChange={(value) => setNoteForm({ ...noteForm, budgetCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Judul</Label>
              <Input
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="Masukkan judul catatan"
              />
            </div>

            {noteForm.type === "budget" && (
              <div>
                <Label>Jumlah Budget</Label>
                <Input
                  type="number"
                  value={noteForm.budgetAmount}
                  onChange={(e) => setNoteForm({ ...noteForm, budgetAmount: e.target.value })}
                  placeholder="Masukkan jumlah budget"
                />
              </div>
            )}

            <div>
              <Label>Konten</Label>
              <Textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Tulis catatan Anda di sini..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              {editingNote ? "Simpan Perubahan" : "Tambah Catatan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNoteId && deleteNoteMutation.mutate(deleteNoteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}