import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
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
    newValue: string; // Changed to string for proper input handling
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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Test input state
  const [testValue, setTestValue] = useState('');
  
  const initialUpdateData: SimpleUpdateData = {
    keyResults: [],
    successMetrics: [],
    tasks: [],
    reflection: {
      whatWorkedWell: '',
      challenges: ''
    },
    tasksCompleted: 0,
    totalTasks: 0
  };
  
  const [updateData, setUpdateData] = useState<SimpleUpdateData>(initialUpdateData);

  // Fetch data
  const { data: allKeyResults = [] } = useQuery({
    queryKey: ['/api/key-results'],
  });

  // Filter key results for current user only
  const keyResults = allKeyResults.filter((kr: any) => kr.assignedTo === user?.id);

  const { data: allInitiatives = [] } = useQuery({
    queryKey: ['/api/initiatives'],
  });

  // Filter initiatives for current user only (where user is PIC)
  const initiatives = allInitiatives.filter((initiative: any) => initiative.picId === user?.id);

  const { data: allTasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Filter tasks for current user only
  const userTasks = allTasks.filter((task: any) => task.assignedTo === user?.id);

  // Filter tasks for today and overdue
  const todayTasks = userTasks.filter((task: any) => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
    return taskDate === today;
  });

  const overdueTasks = userTasks.filter((task: any) => {
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
  }, [isOpen, keyResults, successMetrics, relevantTasks, initiatives, user?.id]);

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

  const handleOpenDialog = () => {
    // Reset form data and populate with current values when opening dialog
    console.log('Opening dialog with data:', { keyResults, successMetrics, relevantTasks });
    
    const initialData: SimpleUpdateData = {
      keyResults: keyResults.map((kr: any) => ({
        id: kr.id,
        title: kr.title,
        currentValue: parseFloat(kr.currentValue) || 0,
        targetValue: parseFloat(kr.targetValue) || 0,
        unit: kr.unit || '',
        newValue: String(parseFloat(kr.currentValue) || 0), // Start with current value as string, ensure it's never undefined
        notes: ''
      })),
      successMetrics: successMetrics.map((sm: any) => ({
        id: sm.id,
        name: sm.name || '',
        target: sm.target || '',
        achievement: sm.achievement || '',
        initiativeTitle: sm.initiativeTitle || '',
        newValue: sm.achievement || '', // Start with current achievement, ensure it's never undefined
        notes: ''
      })),
      tasks: [], // Will be populated when status is changed
      reflection: {
        whatWorkedWell: '',
        challenges: ''
      },
      tasksCompleted: 0,
      totalTasks: relevantTasks.length
    };
    
    console.log('Initial data:', initialData);
    setUpdateData(initialData);
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto"
          onClick={handleOpenDialog}
        >
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
          {/* Test Input */}
          <Card>
            <CardHeader>
              <CardTitle>Test Input</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="text"
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="Test ketik di sini..."
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <p className="mt-2 text-sm text-gray-600">Test value: {testValue}</p>
            </CardContent>
          </Card>
          
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
                              value={(() => {
                                const existingTask = updateData.tasks.find(t => t.id === task.id);
                                const currentStatus = existingTask?.newStatus || task.status;
                                
                                // Ensure we have a valid status that matches our SelectItem values
                                if (['belum_mulai', 'sedang_berjalan', 'selesai', 'dibatalkan'].includes(currentStatus)) {
                                  return currentStatus;
                                }
                                
                                // Map any other status values to expected ones
                                switch (currentStatus) {
                                  case 'belum_dimulai':
                                    return 'belum_mulai';
                                  case 'sedang_dikerjakan':
                                    return 'sedang_berjalan';
                                  case 'completed':
                                    return 'selesai';
                                  case 'cancelled':
                                    return 'dibatalkan';
                                  default:
                                    return 'belum_mulai'; // Default fallback
                                }
                              })()}
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
                                <SelectValue placeholder="Pilih status" />
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
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-900">Key Result</th>
                        <th className="text-left p-2 font-medium text-gray-900">Saat Ini</th>
                        <th className="text-left p-2 font-medium text-gray-900">Nilai Baru</th>
                        <th className="text-left p-2 font-medium text-gray-900">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updateData.keyResults.map((kr, index) => (
                        <tr key={kr.id} className="border-b">
                          <td className="p-2 font-medium text-gray-900">{kr.title}</td>
                          <td className="p-2 text-gray-600">
                            {parseFloat(kr.currentValue) || 0}{kr.unit === 'percentage' ? '%' : ` ${kr.unit}`}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                value={kr.newValue}
                                onChange={(e) => {
                                  const newKeyResults = [...updateData.keyResults];
                                  newKeyResults[index].newValue = e.target.value;
                                  setUpdateData(prevData => ({
                                    ...prevData,
                                    keyResults: newKeyResults
                                  }));
                                }}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <span className="ml-1 text-gray-600 text-sm">
                                {kr.unit === 'percentage' ? '%' : kr.unit}
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={kr.notes || ''}
                              onChange={(e) => {
                                const newKeyResults = [...updateData.keyResults];
                                newKeyResults[index].notes = e.target.value || '';
                                setUpdateData({ ...updateData, keyResults: newKeyResults });
                              }}
                              placeholder="Catatan..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-gray-900">Metric</th>
                        <th className="text-left p-2 font-medium text-gray-900">Inisiatif</th>
                        <th className="text-left p-2 font-medium text-gray-900">Target</th>
                        <th className="text-left p-2 font-medium text-gray-900">Pencapaian Baru</th>
                        <th className="text-left p-2 font-medium text-gray-900">Catatan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {updateData.successMetrics.map((sm, index) => (
                        <tr key={sm.id} className="border-b">
                          <td className="p-2 font-medium text-gray-900">{sm.name}</td>
                          <td className="p-2 text-gray-600 text-xs">{sm.initiativeTitle}</td>
                          <td className="p-2 text-gray-600">{sm.target}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={sm.newValue || ''}
                              onChange={(e) => {
                                const newMetrics = [...updateData.successMetrics];
                                newMetrics[index].newValue = e.target.value || '';
                                setUpdateData({ ...updateData, successMetrics: newMetrics });
                              }}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={sm.notes || ''}
                              onChange={(e) => {
                                const newMetrics = [...updateData.successMetrics];
                                newMetrics[index].notes = e.target.value || '';
                                setUpdateData({ ...updateData, successMetrics: newMetrics });
                              }}
                              placeholder="Catatan..."
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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