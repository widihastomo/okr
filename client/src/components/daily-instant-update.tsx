import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatNumberWithSeparator, handleNumberInputChange } from "@/lib/number-utils";
import { 
  Clock, 
  CheckCircle, 
  Target, 
  ArrowRight, 
  Calendar,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';

interface DailyUpdateData {
  keyResults: Array<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    keyResultType: string;
    newValue?: number;
    notes?: string;
  }>;
  successMetrics: Array<{
    id: string;
    name: string;
    target: string;
    achievement: string;
    initiativeTitle: string;
    newValue?: string;
    notes?: string;
  }>;
  todayTasks: Array<{
    id: string;
    title: string;
    status: string;
    newStatus?: string;
    completed?: boolean;
  }>;
  tomorrowTasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
  }>;
  reflection: {
    whatWorkedWell: string;
    challenges: string;
  };
}

interface DailyInstantUpdateProps {
  trigger?: React.ReactNode;
}

export function DailyInstantUpdate({ trigger }: DailyInstantUpdateProps) {
  const [open, setOpen] = useState(false);
  const [updateData, setUpdateData] = useState<DailyUpdateData>({
    keyResults: [],
    successMetrics: [],
    todayTasks: [],
    tomorrowTasks: [],
    reflection: {
      whatWorkedWell: '',
      challenges: ''
    }
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get today and tomorrow dates
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Fetch data for instant update
  const { data: keyResults } = useQuery({
    queryKey: ['/api/key-results'],
    enabled: open,
  });

  const { data: allTasks } = useQuery({
    queryKey: ['/api/tasks'],
    enabled: open,
  });

  const { data: initiatives } = useQuery({
    queryKey: ['/api/initiatives'],
    enabled: open,
  });

  // Fetch success metrics for active initiatives
  const { data: allSuccessMetrics } = useQuery({
    queryKey: ['/api/success-metrics'],
    queryFn: async () => {
      if (!initiatives) return [];
      
      const metricsPromises = (initiatives as any[])
        .filter(init => init.status === 'sedang_berjalan' || init.status === 'draft')
        .map(async (init) => {
          const response = await fetch(`/api/initiatives/${init.id}/success-metrics`);
          if (!response.ok) return [];
          const metrics = await response.json();
          return metrics.map((metric: any) => ({
            ...metric,
            initiativeTitle: init.title,
            initiativeId: init.id,
          }));
        });
      
      const results = await Promise.all(metricsPromises);
      return results.flat();
    },
    enabled: open && !!initiatives,
  });

  // Filter tasks for today and tomorrow
  const todayTasks = React.useMemo(() => {
    if (!allTasks) return [];
    return (allTasks as any[]).filter((task: any) => {
      const dueDate = task.dueDate ? task.dueDate.split('T')[0] : null;
      return dueDate === todayStr || task.status === 'in_progress';
    });
  }, [allTasks, todayStr]);

  const tomorrowTasks = React.useMemo(() => {
    if (!allTasks) return [];
    return (allTasks as any[]).filter((task: any) => {
      const dueDate = task.dueDate ? task.dueDate.split('T')[0] : null;
      return dueDate === tomorrowStr && task.status !== 'completed' && task.status !== 'cancelled';
    }).sort((a: any, b: any) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });
  }, [allTasks, tomorrowStr]);

  // Calculate key result progress
  const calculateKeyResultProgress = (keyResult: any): number => {
    const current = Number(keyResult.currentValue) || 0;
    const target = Number(keyResult.targetValue) || 0;
    const base = Number(keyResult.baseValue) || 0;

    if (keyResult.keyResultType === "achieve_or_not") {
      return keyResult.achieved ? 100 : 0;
    }

    if (keyResult.keyResultType === "increase_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100));
    }

    if (keyResult.keyResultType === "decrease_to") {
      if (base === target) return 0;
      return Math.min(100, Math.max(0, ((base - current) / (base - target)) * 100));
    }

    if (keyResult.keyResultType === "should_stay_above") {
      return current >= target ? 100 : 0;
    }

    if (keyResult.keyResultType === "should_stay_below") {
      return current <= target ? 100 : 0;
    }

    return 0;
  };

  // Active key results (not completed)
  const activeKeyResults = React.useMemo(() => {
    if (!keyResults) return [];
    return (keyResults as any[]).filter((kr: any) => {
      const progress = calculateKeyResultProgress(kr);
      return progress < 100 && kr.status !== 'completed' && kr.status !== 'cancelled';
    });
  }, [keyResults, calculateKeyResultProgress]);

  // Initialize update data when modal opens
  React.useEffect(() => {
    if (open && (activeKeyResults?.length > 0 || allSuccessMetrics?.length > 0 || todayTasks.length > 0)) {
      setUpdateData({
        keyResults: activeKeyResults?.map((kr: any) => ({
          id: kr.id,
          title: kr.title,
          currentValue: kr.currentValue,
          targetValue: kr.targetValue,
          unit: kr.unit,
          keyResultType: kr.keyResultType,
          newValue: kr.currentValue,
          notes: ''
        })) || [],
        successMetrics: allSuccessMetrics?.map((metric: any) => ({
          id: metric.id,
          name: metric.name,
          target: metric.target,
          achievement: metric.achievement,
          initiativeTitle: metric.initiativeTitle,
          newValue: metric.achievement,
          notes: ''
        })) || [],
        todayTasks: todayTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          newStatus: task.status,
          completed: task.status === 'completed'
        })),
        tomorrowTasks: tomorrowTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          status: task.status
        })),
        reflection: {
          whatWorkedWell: '',
          challenges: ''
        }
      });
    }
  }, [open, activeKeyResults, allSuccessMetrics, todayTasks, tomorrowTasks]);

  // Submit instant update
  const submitUpdateMutation = useMutation({
    mutationFn: async (data: DailyUpdateData) => {
      // Update key results
      for (const kr of data.keyResults) {
        if (kr.newValue !== kr.currentValue && kr.newValue !== undefined) {
          await apiRequest('POST', `/api/key-results/${kr.id}/check-in`, {
            currentValue: kr.newValue,
            notes: kr.notes || `Update harian instant - ${format(today, 'dd MMM yyyy', { locale: id })}`
          });
        }
      }

      // Update success metrics
      for (const metric of data.successMetrics) {
        if (metric.newValue && metric.newValue !== metric.achievement && metric.newValue.trim() !== '') {
          await apiRequest('POST', `/api/success-metrics/${metric.id}/updates`, {
            achievement: metric.newValue,
            notes: metric.notes || `Update harian instant - ${format(today, 'dd MMM yyyy', { locale: id })}`,
            confidence: 4 // Default confidence for instant updates
          });
        }
      }

      // Update task statuses
      for (const task of data.todayTasks) {
        if (task.newStatus !== task.status) {
          await apiRequest('PATCH', `/api/tasks/${task.id}`, {
            status: task.newStatus
          });
        }
      }

      // Create daily reflection entry
      if (data.reflection.whatWorkedWell || data.reflection.challenges) {
        await apiRequest('POST', '/api/daily-reflections', {
          date: todayStr,
          whatWorkedWell: data.reflection.whatWorkedWell,
          challenges: data.reflection.challenges,
          tomorrowPriorities: data.tomorrowTasks.slice(0, 5).map(t => t.title).join(', ')
        });
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Update Harian Berhasil",
        description: "Semua progress dan refleksi telah disimpan"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/key-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reflections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/success-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Menyimpan Update",
        description: error.message || "Terjadi kesalahan saat menyimpan",
        variant: "destructive"
      });
    }
  });

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Sedang Berjalan';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Belum Dimulai';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto">
            <Clock className="h-4 w-4 mr-2" />
            Update Harian Instant
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto sm:max-w-6xl max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Update Harian Instant
          </DialogTitle>
          <DialogDescription>
            Update progress angka target, status task hari ini, dan refleksi harian dalam satu langkah
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Results Update */}
          {updateData.keyResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Update Progress Angka Target
                </CardTitle>
                <CardDescription>
                  Update nilai terkini untuk angka target yang aktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Angka Target
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai Saat Ini
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nilai Baru
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {updateData.keyResults.map((kr, index) => (
                        <tr key={kr.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{kr.title}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatNumberWithSeparator(kr.currentValue.toString())} {kr.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatNumberWithSeparator(kr.targetValue.toString())} {kr.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Input
                              type="text"
                              value={kr.newValue !== undefined ? formatNumberWithSeparator(kr.newValue.toString()) : ''}
                              onChange={(e) => {
                                handleNumberInputChange(e.target.value, (formattedValue) => {
                                  const newData = { ...updateData };
                                  // Remove formatting for storage (convert back to number)
                                  const cleanValue = formattedValue.replace(/[.,]/g, '');
                                  newData.keyResults[index].newValue = parseFloat(cleanValue) || 0;
                                  setUpdateData(newData);
                                });
                              }}
                              placeholder="0"
                              className="w-24"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Input
                              placeholder="Catatan singkat..."
                              value={kr.notes || ''}
                              onChange={(e) => {
                                const newData = { ...updateData };
                                newData.keyResults[index].notes = e.target.value;
                                setUpdateData(newData);
                              }}
                              className="w-40"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {updateData.keyResults.map((kr, index) => (
                    <div key={kr.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <h4 className="font-medium text-gray-900">{kr.title}</h4>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Saat ini:</span>
                          <p className="font-medium">{formatNumberWithSeparator(kr.currentValue.toString())} {kr.unit}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <p className="font-medium">{formatNumberWithSeparator(kr.targetValue.toString())} {kr.unit}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nilai Baru:</label>
                        <Input
                          type="text"
                          value={kr.newValue !== undefined ? formatNumberWithSeparator(kr.newValue.toString()) : ''}
                          onChange={(e) => {
                            handleNumberInputChange(e.target.value, (formattedValue) => {
                              const newData = { ...updateData };
                              // Remove formatting for storage (convert back to number)
                              const cleanValue = formattedValue.replace(/[.,]/g, '');
                              newData.keyResults[index].newValue = parseFloat(cleanValue) || 0;
                              setUpdateData(newData);
                            });
                          }}
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Catatan:</label>
                        <Input
                          placeholder="Catatan singkat..."
                          value={kr.notes || ''}
                          onChange={(e) => {
                            const newData = { ...updateData };
                            newData.keyResults[index].notes = e.target.value;
                            setUpdateData(newData);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Metrics Update */}
          {updateData.successMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Update Metrik Inisiatif
                </CardTitle>
                <CardDescription>
                  Update pencapaian untuk metrik sukses inisiatif aktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Metrik Sukses
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inisiatif
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pencapaian Saat Ini
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Target
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pencapaian Baru
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Catatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {updateData.successMetrics.map((metric, index) => (
                        <tr key={metric.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{metric.name}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {metric.initiativeTitle}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {metric.achievement}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {metric.target}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Input
                              type="text"
                              value={metric.newValue || ''}
                              onChange={(e) => {
                                const newData = { ...updateData };
                                newData.successMetrics[index].newValue = e.target.value;
                                setUpdateData(newData);
                              }}
                              placeholder="Rp 0"
                              className="w-32"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Input
                              placeholder="Catatan singkat..."
                              value={metric.notes || ''}
                              onChange={(e) => {
                                const newData = { ...updateData };
                                newData.successMetrics[index].notes = e.target.value;
                                setUpdateData(newData);
                              }}
                              className="w-32"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {updateData.successMetrics.map((metric, index) => (
                    <div key={metric.id} className="border rounded-lg p-4 space-y-3">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{metric.name}</div>
                        <div className="text-xs text-gray-600">{metric.initiativeTitle}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Saat ini:</span>
                          <div className="font-medium">{metric.achievement}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <div className="font-medium">{metric.target}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Pencapaian Baru:</label>
                        <Input
                          type="text"
                          value={metric.newValue || ''}
                          onChange={(e) => {
                            const newData = { ...updateData };
                            newData.successMetrics[index].newValue = e.target.value;
                            setUpdateData(newData);
                          }}
                          placeholder="Rp 0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Catatan:</label>
                        <Input
                          placeholder="Catatan singkat..."
                          value={metric.notes || ''}
                          onChange={(e) => {
                            const newData = { ...updateData };
                            newData.successMetrics[index].notes = e.target.value;
                            setUpdateData(newData);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks Update */}
          {updateData.todayTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Update Status Task Hari Ini
                </CardTitle>
                <CardDescription>
                  Update status untuk task yang dijadwalkan hari ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Saat Ini
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status Baru
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Selesai
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {updateData.todayTasks.map((task, index) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{task.title}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTaskStatusColor(task.status)}`}>
                              {getTaskStatusLabel(task.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Select
                              value={task.newStatus}
                              onValueChange={(value) => {
                                const newData = { ...updateData };
                                newData.todayTasks[index].newStatus = value;
                                newData.todayTasks[index].completed = value === 'completed';
                                setUpdateData(newData);
                              }}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_started">Belum Dimulai</SelectItem>
                                <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                                <SelectItem value="completed">Selesai</SelectItem>
                                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) => {
                                const newData = { ...updateData };
                                newData.todayTasks[index].completed = !!checked;
                                newData.todayTasks[index].newStatus = checked ? 'completed' : 'in_progress';
                                setUpdateData(newData);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {updateData.todayTasks.map((task, index) => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status saat ini:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTaskStatusColor(task.status)}`}>
                          {getTaskStatusLabel(task.status)}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status Baru:</label>
                        <Select
                          value={task.newStatus}
                          onValueChange={(value) => {
                            const newData = { ...updateData };
                            newData.todayTasks[index].newStatus = value;
                            newData.todayTasks[index].completed = value === 'completed';
                            setUpdateData(newData);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_started">Belum Dimulai</SelectItem>
                            <SelectItem value="in_progress">Sedang Berjalan</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => {
                            const newData = { ...updateData };
                            newData.todayTasks[index].completed = !!checked;
                            newData.todayTasks[index].newStatus = checked ? 'completed' : 'in_progress';
                            setUpdateData(newData);
                          }}
                        />
                        <label className="text-sm font-medium text-gray-700">Tandai sebagai selesai</label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Reflection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Refleksi Harian
              </CardTitle>
              <CardDescription>
                Catat apa yang berjalan baik dan kendala yang dihadapi hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-green-700 mb-2 block">
                  1. Apa yang berjalan baik hari ini:
                </label>
                <Textarea
                  placeholder="Catat pencapaian, progress, atau hal positif yang terjadi hari ini..."
                  value={updateData.reflection.whatWorkedWell}
                  onChange={(e) => setUpdateData({
                    ...updateData,
                    reflection: {
                      ...updateData.reflection,
                      whatWorkedWell: e.target.value
                    }
                  })}
                  className="min-h-20"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-red-700 mb-2 block">
                  2. Apa kendala hari ini:
                </label>
                <Textarea
                  placeholder="Catat hambatan, masalah, atau tantangan yang dihadapi hari ini..."
                  value={updateData.reflection.challenges}
                  onChange={(e) => setUpdateData({
                    ...updateData,
                    reflection: {
                      ...updateData.reflection,
                      challenges: e.target.value
                    }
                  })}
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tomorrow's Priorities */}
          {updateData.tomorrowTasks.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-orange-600" />
                    Prioritas Besok
                  </CardTitle>
                  <span className="text-sm text-gray-500 font-medium">
                    {format(tomorrow, 'dd MMM yyyy', { locale: id })}
                  </span>
                </div>
                <CardDescription>
                  Task yang harus diselesaikan besok, diurutkan berdasarkan prioritas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {updateData.tomorrowTasks.slice(0, 8).map((task, index) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-orange-900">{task.title}</p>
                          <p className="text-sm text-orange-700">
                            Tenggat: {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(task.priority)}>
                        {getPriorityLabel(task.priority)}
                      </Badge>
                    </div>
                  ))}
                  
                  {updateData.tomorrowTasks.length > 8 && (
                    <div className="text-center text-sm text-gray-600 pt-2">
                      +{updateData.tomorrowTasks.length - 8} task lainnya
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button
              onClick={() => submitUpdateMutation.mutate(updateData)}
              disabled={submitUpdateMutation.isPending}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {submitUpdateMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Simpan Update Harian
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}