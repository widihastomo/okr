import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Zap, TrendingUp, Target, Clock, CheckCircle2, AlertTriangle, Calendar, ListTodo } from 'lucide-react';

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Bulk Update Harian
          </DialogTitle>
          <DialogDescription>
            Update massal untuk tasks, angka target, dan progress inisiatif
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tasks
              {relevantTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {relevantTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="targets" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Angka Target
              {updateData.keyResults.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {updateData.keyResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Metrik & Output
              {updateData.successMetrics.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {updateData.successMetrics.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reflection" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Refleksi
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Bulk Update Tasks
                  </div>
                  <div className="flex gap-2">
                    {overdueTasks.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {overdueTasks.length} Terlambat
                      </Badge>
                    )}
                    {todayTasks.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {todayTasks.length} Hari Ini
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Update status task yang terlambat dan jatuh tempo hari ini
                </div>
              </CardHeader>
              <CardContent>
                {relevantTasks.length === 0 ? (
                  <div className="text-center p-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">Tidak ada task yang perlu diupdate</div>
                    <div className="text-sm text-gray-400">Semua task sudah up to date</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relevantTasks.map((task: any) => {
                      const isOverdue = overdueTasks.some(t => t.id === task.id);
                      const isToday = todayTasks.some(t => t.id === task.id);
                      return (
                        <div 
                          key={task.id} 
                          className={`border rounded-lg p-4 transition-colors ${
                            isOverdue ? 'bg-red-50 border-red-200' : 
                            isToday ? 'bg-blue-50 border-blue-200' : 
                            'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900">
                                  {task.title}
                                </h4>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Terlambat
                                  </Badge>
                                )}
                                {isToday && (
                                  <Badge variant="default" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Hari Ini
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString('id-ID')}`}
                                <span className="ml-3">
                                  Status Saat Ini: <span className={`font-medium ${
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
                            <div className="flex items-center gap-3">
                              <Select
                                value={(() => {
                                  const existingTask = updateData.tasks.find(t => t.id === task.id);
                                  const currentStatus = existingTask?.newStatus || task.status;
                                  
                                  // Map status values to expected ones
                                  if (['belum_mulai', 'sedang_berjalan', 'selesai', 'dibatalkan'].includes(currentStatus)) {
                                    return currentStatus;
                                  }
                                  
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
                                      return 'belum_mulai';
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
                                <SelectTrigger className="w-40">
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
                                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                                      Berubah
                                    </Badge>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Results Tab */}
          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Bulk Update Key Results
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Update nilai pencapaian untuk key results yang Anda kelola
                </div>
              </CardHeader>
              <CardContent>
                {updateData.keyResults.length === 0 ? (
                  <div className="text-center p-8">
                    <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">Tidak ada Key Result yang perlu diupdate</div>
                    <div className="text-sm text-gray-400">Anda belum memiliki key result yang ditugaskan</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateData.keyResults.map((kr, index) => (
                      <div key={kr.id} className="border rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-1">
                            <h4 className="font-medium text-gray-900 mb-1">{kr.title}</h4>
                            <div className="text-sm text-gray-500">
                              Target: {kr.targetValue}{kr.unit === 'percentage' ? '%' : ` ${kr.unit}`}
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nilai Saat Ini
                            </label>
                            <div className="text-lg font-semibold text-gray-900">
                              {parseFloat(kr.currentValue) || 0}{kr.unit === 'percentage' ? '%' : ` ${kr.unit}`}
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nilai Baru *
                            </label>
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Masukkan nilai baru"
                              />
                              <span className="ml-2 text-gray-600 text-sm">
                                {kr.unit === 'percentage' ? '%' : kr.unit}
                              </span>
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Catatan
                            </label>
                            <input
                              type="text"
                              value={kr.notes || ''}
                              onChange={(e) => {
                                const newKeyResults = [...updateData.keyResults];
                                newKeyResults[index].notes = e.target.value || '';
                                setUpdateData({ ...updateData, keyResults: newKeyResults });
                              }}
                              placeholder="Catatan update..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Success Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Bulk Update Metrik & Deliverables
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Update pencapaian success metrics dan deliverables dari inisiatif Anda
                </div>
              </CardHeader>
              <CardContent>
                {updateData.successMetrics.length === 0 ? (
                  <div className="text-center p-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">Tidak ada Success Metrics yang perlu diupdate</div>
                    <div className="text-sm text-gray-400">Anda belum memiliki success metrics dari inisiatif</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateData.successMetrics.map((sm, index) => (
                      <div key={sm.id} className="border rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-1">
                            <h4 className="font-medium text-gray-900 mb-1">{sm.name}</h4>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {sm.initiativeTitle}
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Target
                            </label>
                            <div className="text-sm text-gray-600 bg-gray-50 px-2 py-2 rounded">
                              {sm.target}
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pencapaian Saat Ini
                            </label>
                            <div className="text-sm text-gray-600 bg-gray-50 px-2 py-2 rounded">
                              {sm.achievement || 'Belum ada'}
                            </div>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pencapaian Baru *
                            </label>
                            <input
                              type="text"
                              value={sm.newValue || ''}
                              onChange={(e) => {
                                const newMetrics = [...updateData.successMetrics];
                                newMetrics[index].newValue = e.target.value || '';
                                setUpdateData({ ...updateData, successMetrics: newMetrics });
                              }}
                              placeholder="Masukkan pencapaian baru"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Catatan
                            </label>
                            <input
                              type="text"
                              value={sm.notes || ''}
                              onChange={(e) => {
                                const newMetrics = [...updateData.successMetrics];
                                newMetrics[index].notes = e.target.value || '';
                                setUpdateData({ ...updateData, successMetrics: newMetrics });
                              }}
                              placeholder="Catatan progress..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Reflection Tab */}
          <TabsContent value="reflection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Refleksi Harian
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Catat refleksi harian Anda untuk pembelajaran dan peningkatan
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apa yang Berjalan Baik Hari Ini? 🎉
                  </label>
                  <Textarea
                    value={updateData.reflection.whatWorkedWell}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      reflection: { ...updateData.reflection, whatWorkedWell: e.target.value }
                    })}
                    placeholder="Ceritakan pencapaian, kesuksesan, atau hal positif yang terjadi hari ini..."
                    className="min-h-[120px] resize-y"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tantangan yang Dihadapi 🤔
                  </label>
                  <Textarea
                    value={updateData.reflection.challenges}
                    onChange={(e) => setUpdateData({
                      ...updateData,
                      reflection: { ...updateData.reflection, challenges: e.target.value }
                    })}
                    placeholder="Hambatan, kesulitan, atau masalah yang perlu diatasi besok..."
                    className="min-h-[120px] resize-y"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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