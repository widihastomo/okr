import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Zap, TrendingUp, Target, Clock } from 'lucide-react';

interface SimpleUpdateData {
  keyResults: Array<{
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    newValue: number;
    notes: string;
  }>;
  successMetrics: Array<{
    id: string;
    name: string;
    target: string;
    achievement: string;
    initiativeTitle: string;
    newValue: string;
    notes: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    currentStatus: string;
    newStatus: string;
  }>;
  reflection: {
    whatWorkedWell: string;
    challenges: string;
  };
  tasksCompleted: number;
  totalTasks: number;
}

export function DailyUpdateSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  const [updateData, setUpdateData] = useState<SimpleUpdateData>({
    keyResults: [],
    successMetrics: [],
    tasks: [],
    reflection: {
      whatWorkedWell: '',
      challenges: ''
    },
    tasksCompleted: 0,
    totalTasks: 0
  });

  // Fetch data
  const { data: keyResults = [] } = useQuery({
    queryKey: ['/api/key-results'],
  });

  const { data: initiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Filter tasks for today and overdue
  const todayTasks = allTasks.filter((task: any) => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
    return taskDate === today;
  });

  const overdueTasks = allTasks.filter((task: any) => {
    if (!task.dueDate || task.status === 'selesai' || task.status === 'dibatalkan') return false;
    const today = new Date().toISOString().split('T')[0];
    const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
    return taskDate < today;
  });

  const relevantTasks = [...overdueTasks, ...todayTasks];

  const { data: successMetrics = [] } = useQuery({
    queryKey: ['/api/success-metrics', initiatives.map(i => i.id).join(',')],
    queryFn: async () => {
      if (initiatives.length === 0) return [];
      
      const allMetrics = [];
      for (const initiative of initiatives) {
        try {
          const metrics = await apiRequest('GET', `/api/initiatives/${initiative.id}/success-metrics`);
          if (Array.isArray(metrics)) {
            allMetrics.push(...metrics.map((metric: any) => ({
              ...metric,
              initiativeTitle: initiative.title
            })));
          }
        } catch (error) {
          console.error(`Error fetching metrics for initiative ${initiative.id}:`, error);
        }
      }
      return allMetrics;
    },
    enabled: initiatives.length > 0
  });

  // Initialize data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setUpdateData(prev => ({
        ...prev,
        keyResults: keyResults.map((kr: any) => ({
          id: kr.id,
          title: kr.title,
          currentValue: kr.currentValue || 0,
          targetValue: kr.targetValue || 0,
          unit: kr.unit || '',
          newValue: kr.currentValue || 0,
          notes: ''
        })),
        successMetrics: successMetrics.map((sm: any) => ({
          id: sm.id,
          name: sm.name,
          target: sm.target || '',
          achievement: sm.achievement || '',
          initiativeTitle: sm.initiativeTitle || '',
          newValue: sm.achievement || '',
          notes: ''
        })),
        tasks: relevantTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          currentStatus: task.status,
          newStatus: task.status
        })),
        tasksCompleted: relevantTasks.filter((task: any) => task.status === 'selesai').length,
        totalTasks: relevantTasks.length
      }));
    }
  }, [isOpen]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: SimpleUpdateData) => {
      // Update key results
      for (const kr of data.keyResults) {
        if (kr.newValue !== kr.currentValue) {
          await apiRequest('PATCH', `/api/key-results/${kr.id}`, {
            currentValue: kr.newValue
          });
        }
      }

      // Update success metrics
      for (const sm of data.successMetrics) {
        if (sm.newValue !== sm.achievement && sm.id) {
          try {
            await apiRequest('PATCH', `/api/success-metrics/${sm.id}`, {
              achievement: sm.newValue
            });
          } catch (error) {
            console.error(`Error updating success metric ${sm.id}:`, error);
          }
        }
      }

      // Update task statuses based on user selections
      for (const taskUpdate of data.tasks) {
        if (taskUpdate.newStatus !== taskUpdate.currentStatus) {
          await apiRequest('PATCH', `/api/tasks/${taskUpdate.id}`, {
            status: taskUpdate.newStatus
          });
        }
      }

      // Create daily reflection (if reflection content exists)
      if (data.reflection.whatWorkedWell || data.reflection.challenges) {
        try {
          await apiRequest('POST', '/api/daily-reflections', {
            date: new Date().toISOString().split('T')[0],
            whatWorkedWell: data.reflection.whatWorkedWell,
            challenges: data.reflection.challenges,
            keyResultUpdates: data.keyResults.filter(kr => kr.notes),
            successMetricUpdates: data.successMetrics.filter(sm => sm.notes),
            tasksCompleted: data.tasks.filter(t => t.newStatus === 'selesai').length
          });
        } catch (error) {
          console.error('Error creating daily reflection:', error);
          // Continue even if reflection fails
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Update Berhasil!",
        description: "Update harian telah disimpan dengan sukses.",
        variant: "success"
      });
      setIsOpen(false);
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/key-results'] });
      queryClient.invalidateQueries({ queryKey: ['/api/success-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reflections'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = () => {
    submitMutation.mutate(updateData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
          <Zap className="mr-2 h-4 w-4" />
          Update Harian Instan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Harian Instan</DialogTitle>
          <DialogDescription>
            Update cepat progress hari ini
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Tasks Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Task ({overdueTasks.length} Overdue, {todayTasks.length} Hari Ini)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {relevantTasks.length === 0 ? (
                  <div className="text-center p-4">
                    <div className="text-gray-500">Tidak ada task yang perlu diupdate</div>
                  </div>
                ) : (
                  relevantTasks.map((task: any) => {
                    const isOverdue = overdueTasks.some(t => t.id === task.id);
                    return (
                      <div key={task.id} className={`border rounded-lg p-3 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {task.title.length > 40 ? `${task.title.substring(0, 40)}...` : task.title}
                              {isOverdue && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Terlambat</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                              {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString('id-ID')}`}
                              <span className="ml-2">
                                Status: <span className={`font-medium ${
                                  task.status === 'selesai' ? 'text-green-600' :
                                  task.status === 'sedang_berjalan' ? 'text-blue-600' :
                                  task.status === 'dibatalkan' ? 'text-red-600' :
                                  'text-gray-600'
                                }`}>
                                  {task.status === 'selesai' ? 'Selesai' :
                                   task.status === 'sedang_berjalan' ? 'Sedang Berjalan' :
                                   task.status === 'dibatalkan' ? 'Dibatalkan' :
                                   'Belum Mulai'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="w-36 flex items-center gap-2">
                            <Select
                              value={updateData.tasks.find(t => t.id === task.id)?.newStatus || task.status}
                              onValueChange={(status) => {
                                const newTasks = [...updateData.tasks];
                                const taskIndex = newTasks.findIndex(t => t.id === task.id);
                                if (taskIndex !== -1) {
                                  newTasks[taskIndex].newStatus = status;
                                } else {
                                  newTasks.push({
                                    id: task.id,
                                    title: task.title,
                                    currentStatus: task.status,
                                    newStatus: status
                                  });
                                }
                                setUpdateData({ ...updateData, tasks: newTasks });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih status">
                                  {(() => {
                                    const currentStatus = updateData.tasks.find(t => t.id === task.id)?.newStatus || task.status;
                                    switch (currentStatus) {
                                      case 'belum_mulai': return 'Belum Mulai';
                                      case 'sedang_berjalan': return 'Sedang Berjalan';
                                      case 'selesai': return 'Selesai';
                                      case 'dibatalkan': return 'Dibatalkan';
                                      default: return 'Pilih status';
                                    }
                                  })()}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="belum_mulai">Belum Mulai</SelectItem>
                                <SelectItem value="sedang_berjalan">Sedang Berjalan</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                              </SelectContent>
                            </Select>
                            {(() => {
                              const taskUpdate = updateData.tasks.find(t => t.id === task.id);
                              if (taskUpdate && taskUpdate.newStatus !== task.status) {
                                return (
                                  <div className="text-xs text-orange-600 font-medium">
                                    Berubah
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Results */}
          {updateData.keyResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Key Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateData.keyResults.map((kr, index) => (
                  <div key={kr.id} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-2">{kr.title}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Nilai Saat Ini</label>
                        <div className="text-lg font-semibold">{kr.currentValue} {kr.unit}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Nilai Baru</label>
                        <input
                          type="number"
                          value={kr.newValue}
                          onChange={(e) => {
                            const newKeyResults = [...updateData.keyResults];
                            newKeyResults[index].newValue = Number(e.target.value);
                            setUpdateData({ ...updateData, keyResults: newKeyResults });
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-gray-600">Catatan (Opsional)</label>
                      <Textarea
                        value={kr.notes}
                        onChange={(e) => {
                          const newKeyResults = [...updateData.keyResults];
                          newKeyResults[index].notes = e.target.value;
                          setUpdateData({ ...updateData, keyResults: newKeyResults });
                        }}
                        placeholder="Tambahkan catatan untuk perubahan ini..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Success Metrics */}
          {updateData.successMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Success Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateData.successMetrics.map((sm, index) => (
                  <div key={sm.id} className="border rounded-lg p-4">
                    <div className="font-medium text-gray-900 mb-1">{sm.name}</div>
                    <div className="text-sm text-gray-600 mb-2">Inisiatif: {sm.initiativeTitle}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Target</label>
                        <div className="text-sm font-medium">{sm.target}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Pencapaian Baru</label>
                        <input
                          type="text"
                          value={sm.newValue}
                          onChange={(e) => {
                            const newMetrics = [...updateData.successMetrics];
                            newMetrics[index].newValue = e.target.value;
                            setUpdateData({ ...updateData, successMetrics: newMetrics });
                          }}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-sm text-gray-600">Catatan (Opsional)</label>
                      <Textarea
                        value={sm.notes}
                        onChange={(e) => {
                          const newMetrics = [...updateData.successMetrics];
                          newMetrics[index].notes = e.target.value;
                          setUpdateData({ ...updateData, successMetrics: newMetrics });
                        }}
                        placeholder="Tambahkan catatan untuk pencapaian ini..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Daily Reflection */}
          <Card>
            <CardHeader>
              <CardTitle>Refleksi Harian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Apa yang Berjalan Baik Hari Ini?</label>
                <Textarea
                  value={updateData.reflection.whatWorkedWell}
                  onChange={(e) => setUpdateData({
                    ...updateData,
                    reflection: { ...updateData.reflection, whatWorkedWell: e.target.value }
                  })}
                  placeholder="Ceritakan pencapaian atau hal positif hari ini..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Tantangan yang Dihadapi</label>
                <Textarea
                  value={updateData.reflection.challenges}
                  onChange={(e) => setUpdateData({
                    ...updateData,
                    reflection: { ...updateData.reflection, challenges: e.target.value }
                  })}
                  placeholder="Hambatan atau kesulitan yang perlu diatasi..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitMutation.isPending}
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {submitMutation.isPending ? 'Menyimpan...' : 'Simpan Update Harian'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}