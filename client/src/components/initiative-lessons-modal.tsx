import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { insertInitiativeLessonSchema, type InsertInitiativeLesson } from "@shared/schema";
import { BookOpen } from "lucide-react";

interface InitiativeLessonsModalProps {
  initiativeId: string;
  trigger?: React.ReactNode;
}

const lessonTypes = [
  { value: "process", label: "Proses" },
  { value: "technical", label: "Teknis" },
  { value: "team", label: "Tim" },
  { value: "communication", label: "Komunikasi" },
  { value: "resource", label: "Sumber Daya" },
  { value: "timeline", label: "Timeline" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "other", label: "Lainnya" }
];

const impactLevels = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" }
];

const lessonsFormSchema = insertInitiativeLessonSchema.omit({
  id: true,
  initiativeId: true,
  documentedBy: true,
  createdAt: true
});

export function InitiativeLessonsModal({ initiativeId, trigger }: InitiativeLessonsModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<Omit<InsertInitiativeLesson, 'id' | 'initiativeId' | 'documentedBy' | 'createdAt'>>({
    resolver: zodResolver(lessonsFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "process",
      impact: "medium",
      actionable: false,
      recommendation: ""
    }
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: Omit<InsertInitiativeLesson, 'id' | 'documentedBy' | 'createdAt'>) =>
      apiRequest(`/api/initiatives/${initiativeId}/lessons`, {
        method: "POST",
        body: data
      }),
    onSuccess: () => {
      toast({
        title: "Sukses",
        description: "Pembelajaran berhasil didokumentasikan",
        className: "border-green-200 bg-green-50 text-green-800"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/initiatives", initiativeId, "analysis"] });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error creating lesson:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan pembelajaran",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: Omit<InsertInitiativeLesson, 'id' | 'initiativeId' | 'documentedBy' | 'createdAt'>) => {
    createLessonMutation.mutate({
      ...data,
      initiativeId
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Tambah Pembelajaran
        </Button>
      )}

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Dokumentasi Pembelajaran</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Pembelajaran</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ringkasan singkat pembelajaran yang didapat"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi Detail</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Jelaskan secara detail apa yang dipelajari, konteks situasi, dan penyebabnya..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori Pembelajaran</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lessonTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tingkat Dampak</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tingkat dampak" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {impactLevels.map((impact) => (
                          <SelectItem key={impact.value} value={impact.value}>
                            {impact.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="actionable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Pembelajaran ini dapat ditindaklanjuti
                    </FormLabel>
                    <p className="text-sm text-gray-600">
                      Centang jika pembelajaran ini bisa diterapkan pada inisiatif mendatang
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rekomendasi Tindak Lanjut</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Apa yang harus dilakukan di masa depan berdasarkan pembelajaran ini?"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createLessonMutation.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createLessonMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createLessonMutation.isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}