import React, { useState, useMemo } from 'react';
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
    initiativeId: string;
    newValue: string;
    notes: string;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    description: string;
    isCompleted: boolean;
    initiativeTitle: string;
    initiativeId: string;
    newCompleted: boolean;
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
    deliverables: [],
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

  // Filter initiatives for current user only (where user is PIC) using useMemo for stability
  const initiatives = useMemo(() => {
    const filtered = allInitiatives.filter((initiative: any) => initiative.picId === user?.id);
    console.log('All initiatives:', allInitiatives);
    console.log('User ID:', user?.id);
    console.log('Filtered initiatives (user is PIC):', filtered);
    return filtered;
  }, [allInitiatives, user?.id]);

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
    queryKey: ['/api/success-metrics', initiatives.length > 0 ? initiatives.map(i => i.id).sort().join(',') : 'none'],
    queryFn: async () => {
          if (initiatives.length === 0) return [];
      
      const allMetrics = [];
      for (const initiative of initiatives) {
        try {
          const response = await apiRequest('GET', `/api/initiatives/${initiative.id}/success-metrics`);
          const metrics = await response.json();

          if (Array.isArray(metrics)) {
            allMetrics.push(...metrics.map((metric: any) => ({
              ...metric,
              initiativeTitle: initiative.title,
              initiativeId: initiative.id
            })));
          }
        } catch (error) {
          console.error(`Error fetching metrics for initiative ${initiative.id}:`, error);
        }
      }

      return allMetrics;
    },
    enabled: initiatives.length > 0,
    staleTime: 0, // Force fresh data
    refetchOnMount: true
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['/api/deliverables', initiatives.length > 0 ? initiatives.map(i => i.id).sort().join(',') : 'none'],
    queryFn: async () => {
          if (initiatives.length === 0) return [];
      
      const allDeliverables = [];
      for (const initiative of initiatives) {
        try {
          const response = await apiRequest('GET', `/api/initiatives/${initiative.id}/definition-of-done`);
          const deliverableItems = await response.json();

          if (Array.isArray(deliverableItems)) {
            allDeliverables.push(...deliverableItems.map((item: any) => ({
              ...item,
              initiativeTitle: initiative.title,
              initiativeId: initiative.id
            })));
          }
        } catch (error) {
          console.error(`Error fetching deliverables for initiative ${initiative.id}:`, error);
        }
      }

      return allDeliverables;
    },
    enabled: initiatives.length > 0,
    staleTime: 0, // Force fresh data
    refetchOnMount: true
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
          initiativeId: sm.initiativeId || '',
          newValue: sm.achievement || '',
          notes: ''
        })),
        deliverables: deliverables.map((d: any) => ({
          id: d.id,
          title: d.title || '',
          description: d.description || '',
          isCompleted: d.isCompleted || false,
          initiativeTitle: d.initiativeTitle || '',
          initiativeId: d.initiativeId || '',
          newCompleted: d.isCompleted || false,
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
  }, [isOpen, keyResults, successMetrics, deliverables, relevantTasks, initiatives, user?.id]);

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

      // Update deliverables
      for (const deliverable of data.deliverables) {
        if (deliverable.newCompleted !== deliverable.isCompleted && deliverable.id) {
          try {
            await apiRequest('PATCH', `/api/definition-of-done/${deliverable.id}`, {
              isCompleted: deliverable.newCompleted
            });
          } catch (error) {
            console.error(`Error updating deliverable ${deliverable.id}:`, error);
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
            deliverableUpdates: data.deliverables?.filter(d => d.notes) || [],
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
    console.log('Opening dialog with data:', { keyResults, successMetrics, deliverables, relevantTasks });
    
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
        initiativeId: sm.initiativeId || '',
        newValue: sm.achievement || '', // Start with current achievement, ensure it's never undefined
        notes: ''
      })),
      deliverables: deliverables.map((d: any) => ({
        id: d.id,
        title: d.title || '',
        description: d.description || '',
        isCompleted: d.isCompleted || false,
        initiativeTitle: d.initiativeTitle || '',
        initiativeId: d.initiativeId || '',
        newCompleted: d.isCompleted || false, // Start with current completion status
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
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto sm:w-full">
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
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="tasks" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <div className="flex items-center gap-1">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Tasks</span>
              </div>
              {relevantTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {relevantTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="targets" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Target</span>
              </div>
              {updateData.keyResults.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {updateData.keyResults.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Metrik</span>
              </div>
              {updateData.successMetrics.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {updateData.successMetrics.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reflection" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Refleksi</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm sm:text-base">Bulk Update Tasks</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {overdueTasks.length > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="hidden sm:inline">{overdueTasks.length} Terlambat</span>
                        <span className="sm:hidden">{overdueTasks.length}</span>
                      </Badge>
                    )}
                    {todayTasks.length > 0 && (
                      <Badge variant="default" className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">{todayTasks.length} Hari Ini</span>
                        <span className="sm:hidden">{todayTasks.length}</span>
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
                          className={`border rounded-lg p-3 sm:p-4 transition-colors ${
                            isOverdue ? 'bg-red-50 border-red-200' : 
                            isToday ? 'bg-blue-50 border-blue-200' : 
                            'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {task.title}
                                </h4>
                                <div className="flex gap-2">
                                  {isOverdue && (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Terlambat</span>
                                    </Badge>
                                  )}
                                  {isToday && (
                                    <Badge variant="default" className="text-xs">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      <span className="hidden sm:inline">Hari Ini</span>
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                                <div>
                                  {task.dueDate && `Due: ${new Date(task.dueDate).toLocaleDateString('id-ID')}`}
                                </div>
                                <div className="sm:ml-3 sm:inline">
                                  <span className="hidden sm:inline">Status Saat Ini: </span>
                                  <span className={`font-medium ${
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
                            <div className="flex items-center gap-3 flex-shrink-0">
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
                                <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm">
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
                      <div key={kr.id} className="border rounded-lg p-3 sm:p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                                className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Success Metrics
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Update pencapaian success metrics dan deliverables dari inisiatif Anda
                </div>
              </CardHeader>
              <CardContent>
                {(!updateData.successMetrics || updateData.successMetrics.length === 0) ? (
                  <div className="text-center p-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">Tidak ada Success Metrics yang perlu diupdate</div>
                    <div className="text-sm text-gray-400">Anda belum memiliki success metrics dari inisiatif</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateData.successMetrics.map((sm, index) => (
                      <div key={sm.id} className="border rounded-lg p-3 sm:p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deliverables Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Output/Deliverables
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Update status completion deliverables dari inisiatif Anda
                </div>
              </CardHeader>
              <CardContent>
                {(!updateData.deliverables || updateData.deliverables.length === 0) ? (
                  <div className="text-center p-8">
                    <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <div className="text-gray-500 font-medium">Tidak ada Deliverables yang perlu diupdate</div>
                    <div className="text-sm text-gray-400">Anda belum memiliki output/deliverables dari inisiatif</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {updateData.deliverables.map((deliverable, index) => (
                      <div key={deliverable.id} className="border rounded-lg p-3 sm:p-4 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          <div className="lg:col-span-1">
                            <h4 className="font-medium text-gray-900 mb-1">{deliverable.title}</h4>
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {deliverable.initiativeTitle}
                            </div>
                            {deliverable.description && (
                              <div className="text-sm text-gray-600 mt-1">
                                {deliverable.description}
                              </div>
                            )}
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status Saat Ini
                            </label>
                            <Badge variant={deliverable.isCompleted ? 'default' : 'secondary'}>
                              {deliverable.isCompleted ? 'Selesai' : 'Belum Selesai'}
                            </Badge>
                          </div>
                          <div className="lg:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status Baru *
                            </label>
                            <select
                              value={deliverable.newCompleted ? 'true' : 'false'}
                              onChange={(e) => {
                                const newDeliverables = [...updateData.deliverables];
                                newDeliverables[index].newCompleted = e.target.value === 'true';
                                setUpdateData({ ...updateData, deliverables: newDeliverables });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="false">Belum Selesai</option>
                              <option value="true">Selesai</option>
                            </select>
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
                    className="min-h-[80px] sm:min-h-[120px] resize-y text-xs sm:text-sm"
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
                    className="min-h-[80px] sm:min-h-[120px] resize-y text-xs sm:text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={submitMutation.isPending}
            className="w-full sm:w-auto text-sm"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-sm"
          >
            {submitMutation.isPending ? 'Menyimpan...' : 'Simpan Update'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}