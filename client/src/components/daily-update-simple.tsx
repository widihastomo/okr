import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, TrendingUp, Target, Clock } from 'lucide-react';

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
    queryKey: ['/api/success-metrics'],
    queryFn: async () => {
      const allMetrics = [];
      for (const initiative of initiatives) {
        try {
          const metrics = await apiRequest('GET', `/api/initiatives/${initiative.id}/success-metrics`);
          allMetrics.push(...metrics.map((metric: any) => ({
            ...metric,
            initiativeTitle: initiative.title
          })));
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
        tasksCompleted: todayTasks.filter((task: any) => task.status === 'completed').length,
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
        if (sm.newValue !== sm.achievement) {
          await apiRequest('PATCH', `/api/success-metrics/${sm.id}`, {
            achievement: sm.newValue
          });
        }
      }

      // Mark all today's tasks as completed
      for (const task of todayTasks) {
        if (task.status !== 'completed') {
          await apiRequest('PATCH', `/api/tasks/${task.id}`, {
            status: 'completed',
            completed: true
          });
        }
      }

      // Create daily reflection
      await apiRequest('POST', '/api/daily-reflections', {
        date: new Date().toISOString().split('T')[0],
        whatWorkedWell: data.reflection.whatWorkedWell,
        challenges: data.reflection.challenges,
        keyResultUpdates: data.keyResults.filter(kr => kr.notes),
        successMetricUpdates: data.successMetrics.filter(sm => sm.notes),
        tasksCompleted: todayTasks.length
      });
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
        className="bg-orange-600 hover:bg-orange-700 text-white"
      >
        <CheckCircle className="mr-2 h-4 w-4" />
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
              <div className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">
                  {updateData.totalTasks} Task
                </div>
                <div className="text-sm text-gray-600">
                  Semua task akan dimark selesai saat submit
                </div>
                {todayTasks.map((task: any) => (
                  <div key={task.id} className="text-sm bg-gray-50 rounded p-2 mt-2">
                    ✓ {task.title}
                  </div>
                ))}
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