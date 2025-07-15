import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const { data: todayTasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    select: (data) => data.filter((task: any) => {
      const today = new Date().toISOString().split('T')[0];
      const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
      return taskDate === today;
    })
  });

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
    if (isOpen && keyResults.length > 0) {
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
        tasks: todayTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          currentStatus: task.status,
          newStatus: task.status
        })),
        tasksCompleted: todayTasks.filter((task: any) => task.status === 'selesai').length,
        totalTasks: todayTasks.length
      }));
    }
  }, [isOpen, keyResults, successMetrics, todayTasks]);

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

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
      >
        <Zap className="mr-2 h-4 w-4" />
        Update Harian Instan
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Update Harian Instan</h2>
          <p className="text-gray-600 mt-1">Update cepat progress hari ini</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Tasks Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Task Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayTasks.length === 0 ? (
                  <div className="text-center p-4">
                    <div className="text-gray-500">Tidak ada task untuk hari ini</div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <div className="text-2xl font-bold text-green-600">
                        {todayTasks.length} Task Hari Ini
                      </div>
                    </div>
                    {todayTasks.map((task: any) => (
                      <div key={task.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                            <div className="text-sm text-gray-600 mb-2">
                              Status saat ini: <span className={`font-medium ${
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
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Update Status:
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {['belum_mulai', 'sedang_berjalan', 'selesai', 'dibatalkan'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
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
                                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                  (updateData.tasks.find(t => t.id === task.id)?.newStatus || task.status) === status
                                    ? status === 'selesai' ? 'bg-green-100 text-green-800 border-green-300' :
                                      status === 'sedang_berjalan' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                      status === 'dibatalkan' ? 'bg-red-100 text-red-800 border-red-300' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                } border`}
                              >
                                {status === 'selesai' ? 'Selesai' :
                                 status === 'sedang_berjalan' ? 'Sedang Berjalan' :
                                 status === 'dibatalkan' ? 'Dibatalkan' :
                                 'Belum Mulai'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
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
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
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
      </div>
    </div>
  );
}