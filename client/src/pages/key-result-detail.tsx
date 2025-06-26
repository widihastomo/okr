import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowLeft, Plus, TrendingUp, Calendar, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { KeyResultWithDetails, InsertCheckIn, InsertInitiative } from "@shared/schema";

const checkInSchema = z.object({
  keyResultId: z.number(),
  value: z.number(),
  notes: z.string().optional(),
});

const initiativeSchema = z.object({
  keyResultId: z.number(),
  title: z.string().min(1, "Judul inisiatif harus diisi"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold"]).default("not_started"),
  dueDate: z.string().optional(),
});

type CheckInFormData = z.infer<typeof checkInSchema>;
type InitiativeFormData = z.infer<typeof initiativeSchema>;

export default function KeyResultDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [initiativeModalOpen, setInitiativeModalOpen] = useState(false);

  const { data: keyResult, isLoading } = useQuery<KeyResultWithDetails>({
    queryKey: ["/api/key-results", id, "details"],
  });

  const checkInForm = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      keyResultId: parseInt(id || "0"),
      value: 0,
      notes: "",
    },
  });

  const initiativeForm = useForm<InitiativeFormData>({
    resolver: zodResolver(initiativeSchema),
    defaultValues: {
      keyResultId: parseInt(id || "0"),
      title: "",
      description: "",
      status: "not_started",
      dueDate: "",
    },
  });

  const createCheckInMutation = useMutation({
    mutationFn: async (data: CheckInFormData) => {
      await apiRequest("/api/check-ins", "POST", {
        keyResultId: parseInt(id!),
        value: data.value,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/key-results", id, "details"] });
      setCheckInModalOpen(false);
      checkInForm.reset();
      toast({
        title: "Berhasil",
        description: "Check-in berhasil ditambahkan",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (data: InitiativeFormData) => {
      await apiRequest("/api/initiatives", "POST", {
        keyResultId: parseInt(id!),
        title: data.title,
        status: data.status,
        description: data.description || undefined,
        dueDate: data.dueDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/key-results", id, "details"] });
      setInitiativeModalOpen(false);
      initiativeForm.reset();
      toast({
        title: "Berhasil",
        description: "Inisiatif berhasil ditambahkan",
      });
    },
    onError: (error) => {
      toast({
        title: "Gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateProgress = (current: string, target: string, keyResultType: string, baseValue?: string | null): number => {
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const baseNum = baseValue ? parseFloat(baseValue) : 0;

    if (keyResultType === "achieve_or_not") {
      return currentNum >= targetNum ? 100 : 0;
    } else if (keyResultType === "decrease_to") {
      if (baseNum === targetNum) return 100;
      return Math.max(0, Math.min(100, ((baseNum - currentNum) / (baseNum - targetNum)) * 100));
    } else {
      if (baseNum === targetNum) return 100;
      return Math.max(0, Math.min(100, ((currentNum - baseNum) / (targetNum - baseNum)) * 100));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "on_track": return "bg-blue-500";
      case "at_risk": return "bg-yellow-500";
      case "in_progress": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Selesai";
      case "on_track": return "Sesuai Target";
      case "at_risk": return "Berisiko";
      case "in_progress": return "Dalam Progress";
      case "not_started": return "Belum Dimulai";
      case "on_hold": return "Ditunda";
      default: return status;
    }
  };

  const onCheckInSubmit = (data: CheckInFormData) => {
    createCheckInMutation.mutate(data);
  };

  const onInitiativeSubmit = (data: InitiativeFormData) => {
    createInitiativeMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!keyResult) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Key Result tidak ditemukan</h1>
          <Button onClick={() => setLocation("/company-okrs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Company OKRs
          </Button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(keyResult.currentValue, keyResult.targetValue, keyResult.keyResultType, keyResult.baseValue);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/company-okrs")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{keyResult.title}</h1>
            <p className="text-gray-600">{keyResult.description}</p>
          </div>
        </div>
        <Badge className={getStatusColor(keyResult.status)}>
          {getStatusText(keyResult.status)}
        </Badge>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{keyResult.currentValue}</div>
              <div className="text-sm text-gray-600">Nilai Saat Ini</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{keyResult.targetValue}</div>
              <div className="text-sm text-gray-600">Target</div>
            </div>
            {keyResult.baseValue && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{keyResult.baseValue}</div>
                <div className="text-sm text-gray-600">Nilai Awal</div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex space-x-4">
        <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Tambah Check-in
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Check-in Progress</DialogTitle>
              <DialogDescription>
                Update progress terbaru untuk key result ini
              </DialogDescription>
            </DialogHeader>
            <Form {...checkInForm}>
              <form onSubmit={checkInForm.handleSubmit(onCheckInSubmit)} className="space-y-4">
                <FormField
                  control={checkInForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nilai Progress</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Masukkan nilai progress"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={checkInForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tambahkan catatan tentang progress ini..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCheckInModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCheckInMutation.isPending}
                  >
                    {createCheckInMutation.isPending ? "Menyimpan..." : "Simpan Check-in"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={initiativeModalOpen} onOpenChange={setInitiativeModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Inisiatif
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Inisiatif Baru</DialogTitle>
              <DialogDescription>
                Buat inisiatif atau proyek untuk mencapai key result ini
              </DialogDescription>
            </DialogHeader>
            <Form {...initiativeForm}>
              <form onSubmit={initiativeForm.handleSubmit(onInitiativeSubmit)} className="space-y-4">
                <FormField
                  control={initiativeForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul Inisiatif</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan judul inisiatif" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={initiativeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan detail inisiatif ini..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={initiativeForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Target (Opsional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInitiativeModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createInitiativeMutation.isPending}
                  >
                    {createInitiativeMutation.isPending ? "Menyimpan..." : "Simpan Inisiatif"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Check-ins History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Riwayat Check-in
          </CardTitle>
          <CardDescription>
            Riwayat update progress untuk key result ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keyResult.checkIns && keyResult.checkIns.length > 0 ? (
            <div className="space-y-4">
              {keyResult.checkIns.map((checkIn) => (
                <div key={checkIn.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">Nilai: {checkIn.value}</div>
                      {checkIn.notes && (
                        <div className="text-gray-600 mt-1">{checkIn.notes}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {checkIn.createdAt ? new Date(checkIn.createdAt).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada check-in untuk key result ini</p>
              <p className="text-sm">Klik "Tambah Check-in" untuk mulai melacak progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Initiatives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Inisiatif & Proyek
          </CardTitle>
          <CardDescription>
            Inisiatif dan proyek yang dilakukan untuk mencapai key result ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keyResult.initiatives && keyResult.initiatives.length > 0 ? (
            <div className="space-y-4">
              {keyResult.initiatives.map((initiative) => (
                <div key={initiative.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{initiative.title}</h4>
                    <Badge variant={initiative.status === "completed" ? "default" : "secondary"}>
                      {getStatusText(initiative.status)}
                    </Badge>
                  </div>
                  {initiative.description && (
                    <p className="text-gray-600 mb-2">{initiative.description}</p>
                  )}
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Dibuat: {initiative.createdAt ? new Date(initiative.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                    {initiative.dueDate && (
                      <span>Target: {new Date(initiative.dueDate).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada inisiatif untuk key result ini</p>
              <p className="text-sm">Klik "Tambah Inisiatif" untuk mulai merencanakan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}