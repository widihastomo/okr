import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Clock, 
  Bell, 
  Calendar, 
  CheckCircle2, 
  Settings,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface ReminderSettings {
  id?: string;
  isEnabled: boolean;
  cadence: 'harian' | 'mingguan' | 'bulanan';
  reminderTime: string;
  reminderDay?: string; // For weekly/monthly
  reminderDate?: string; // For monthly
  enableEmailReminders: boolean;
  enableNotifications: boolean;
  autoUpdateTasks: boolean;
  reminderMessage?: string;
  notificationTypes?: {
    updateOverdue: boolean;
    taskOverdue: boolean;
    initiativeOverdue: boolean;
    keyResultOverdue: boolean;
    checkInOverdue: boolean;
    progressReminder: boolean;
    deadlineWarning: boolean;
  };
}

const dayOptions = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' }
];

const timeOptions = [
  { value: '08:00', label: '08:00 - Pagi' },
  { value: '09:00', label: '09:00 - Pagi' },
  { value: '12:00', label: '12:00 - Siang' },
  { value: '15:00', label: '15:00 - Siang' },
  { value: '17:00', label: '17:00 - Sore' },
  { value: '19:00', label: '19:00 - Malam' },
  { value: '20:00', label: '20:00 - Malam' }
];

export default function ReminderSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current reminder settings
  const { data: reminderSettings, isLoading } = useQuery({
    queryKey: ['/api/reminder-settings'],
    queryFn: () => apiRequest('GET', '/api/reminder-settings')
  });

  // Fetch onboarding data for initial values
  const { data: onboardingData } = useQuery({
    queryKey: ['/api/onboarding/status'],
  });

  const [settings, setSettings] = useState<ReminderSettings>({
    isEnabled: true,
    cadence: 'harian',
    reminderTime: '17:00',
    reminderDay: 'senin',
    reminderDate: '1',
    enableEmailReminders: true,
    enableNotifications: true,
    autoUpdateTasks: false,
    reminderMessage: 'Saatnya update progress harian Anda!',
    notificationTypes: {
      updateOverdue: true,
      taskOverdue: true,
      initiativeOverdue: true,
      keyResultOverdue: true,
      checkInOverdue: true,
      progressReminder: true,
      deadlineWarning: true,
    }
  });

  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState('17:00');

  // Initialize settings from API data or onboarding data
  React.useEffect(() => {
    if (reminderSettings) {
      setSettings(reminderSettings);
      // Check if the time is in preset options
      const isPresetTime = timeOptions.some(option => option.value === reminderSettings.reminderTime);
      if (!isPresetTime && reminderSettings.reminderTime) {
        setUseCustomTime(true);
        setCustomTime(reminderSettings.reminderTime);
      }
    } else if (onboardingData?.data) {
      // Use onboarding data as defaults
      const onboarding = onboardingData.data;
      const reminderTime = onboarding.reminderTime || '17:00';
      setSettings(prev => ({
        ...prev,
        cadence: onboarding.cadence || 'harian',
        reminderTime: reminderTime,
        reminderDay: onboarding.reminderDay || 'senin',
        reminderDate: onboarding.reminderDate || '1'
      }));
      
      // Check if the time is in preset options
      const isPresetTime = timeOptions.some(option => option.value === reminderTime);
      if (!isPresetTime) {
        setUseCustomTime(true);
        setCustomTime(reminderTime);
      }
    }
  }, [reminderSettings, onboardingData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: ReminderSettings) => 
      apiRequest('POST', '/api/reminder-settings', data),
    onSuccess: () => {
      toast({
        title: "Pengaturan Tersimpan!",
        description: "Pengaturan reminder telah diperbarui.",
        variant: "success"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reminder-settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Menyimpan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleTestReminder = async () => {
    try {
      await apiRequest('POST', '/api/reminder-settings/test');
      toast({
        title: "Test Reminder Berhasil!",
        description: "Cek email dan notifikasi Anda.",
        variant: "success"
      });
    } catch (error: any) {
      toast({
        title: "Test Gagal",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-orange-600" />
          Pengaturan Reminder
        </h1>
        <p className="text-gray-600 mt-2">
          Atur pengingat untuk update progress berdasarkan data onboarding Anda
        </p>
      </div>

      <div className="grid gap-6">
        {/* Enable/Disable Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Status Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-reminder" className="text-base font-medium">
                  Aktifkan Reminder
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  Dapatkan pengingat untuk update progress secara rutin
                </p>
              </div>
              <Switch
                id="enable-reminder"
                checked={settings.isEnabled}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, isEnabled: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {settings.isEnabled && (
          <>
            {/* Frequency Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Frekuensi Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm font-medium">Cadence</Label>
                  <Select
                    value={settings.cadence}
                    onValueChange={(value: any) => 
                      setSettings({ ...settings, cadence: value })
                    }
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="harian">Harian</SelectItem>
                      <SelectItem value="mingguan">Mingguan</SelectItem>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.cadence === 'mingguan' && (
                  <div>
                    <Label className="text-sm font-medium">Hari dalam Seminggu</Label>
                    <Select
                      value={settings.reminderDay}
                      onValueChange={(value) => 
                        setSettings({ ...settings, reminderDay: value })
                      }
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map(day => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {settings.cadence === 'bulanan' && (
                  <div>
                    <Label className="text-sm font-medium">Tanggal dalam Bulan</Label>
                    <Input
                      type="number"
                      min="1"
                      max="28"
                      value={settings.reminderDate}
                      onChange={(e) => 
                        setSettings({ ...settings, reminderDate: e.target.value })
                      }
                      className="w-full mt-1"
                      placeholder="1-28"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Waktu Reminder</Label>
                  
                  {/* Toggle between preset and custom time */}
                  <div className="flex items-center gap-4 mt-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setUseCustomTime(false)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        !useCustomTime
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      Pilih Waktu
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomTime(true)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        useCustomTime
                          ? 'bg-orange-100 text-orange-700 border border-orange-300'
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}
                    >
                      Waktu Kustom
                    </button>
                  </div>

                  {/* Preset time selector */}
                  {!useCustomTime && (
                    <Select
                      value={settings.reminderTime}
                      onValueChange={(value) => 
                        setSettings({ ...settings, reminderTime: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Custom time input */}
                  {useCustomTime && (
                    <div className="space-y-2">
                      <Input
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          setCustomTime(e.target.value);
                          setSettings({ ...settings, reminderTime: e.target.value });
                        }}
                        className="w-full"
                        placeholder="HH:MM"
                      />
                      <p className="text-xs text-gray-500">
                        Format: HH:MM (24 jam). Contoh: 09:30, 14:15, 20:45
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  Metode Notifikasi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-reminder" className="text-base font-medium">
                      Email Reminder
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Terima reminder via email
                    </p>
                  </div>
                  <Switch
                    id="email-reminder"
                    checked={settings.enableEmailReminders}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableEmailReminders: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notification" className="text-base font-medium">
                      Push Notification
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Terima notifikasi di platform
                    </p>
                  </div>
                  <Switch
                    id="push-notification"
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, enableNotifications: checked })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-update" className="text-base font-medium">
                      Auto-update Tasks
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Otomatis mark task sebagai completed saat reminder
                    </p>
                  </div>
                  <Switch
                    id="auto-update"
                    checked={settings.autoUpdateTasks}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, autoUpdateTasks: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Jenis Notifikasi
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Pilih jenis notifikasi yang ingin Anda terima
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="update-overdue" className="text-base font-medium">
                      Update Overdue
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifikasi ketika update progress terlambat
                    </p>
                  </div>
                  <Switch
                    id="update-overdue"
                    checked={settings.notificationTypes?.updateOverdue || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          updateOverdue: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="task-overdue" className="text-base font-medium">
                      Task Overdue
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifikasi ketika deadline task terlewat
                    </p>
                  </div>
                  <Switch
                    id="task-overdue"
                    checked={settings.notificationTypes?.taskOverdue || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          taskOverdue: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="initiative-overdue" className="text-base font-medium">
                      Inisiatif Overdue
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifikasi ketika update inisiatif terlambat
                    </p>
                  </div>
                  <Switch
                    id="initiative-overdue"
                    checked={settings.notificationTypes?.initiativeOverdue || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          initiativeOverdue: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="keyresult-overdue" className="text-base font-medium">
                      Key Result Overdue
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifikasi ketika update key result terlambat
                    </p>
                  </div>
                  <Switch
                    id="keyresult-overdue"
                    checked={settings.notificationTypes?.keyResultOverdue || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          keyResultOverdue: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="checkin-overdue" className="text-base font-medium">
                      Check-in Overdue
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Notifikasi ketika check-in rutin terlambat
                    </p>
                  </div>
                  <Switch
                    id="checkin-overdue"
                    checked={settings.notificationTypes?.checkInOverdue || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          checkInOverdue: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="progress-reminder" className="text-base font-medium">
                      Progress Reminder
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Reminder rutin untuk update progress
                    </p>
                  </div>
                  <Switch
                    id="progress-reminder"
                    checked={settings.notificationTypes?.progressReminder || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          progressReminder: checked 
                        } 
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="deadline-warning" className="text-base font-medium">
                      Deadline Warning
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Peringatan sebelum deadline mendekati
                    </p>
                  </div>
                  <Switch
                    id="deadline-warning"
                    checked={settings.notificationTypes?.deadlineWarning || false}
                    onCheckedChange={(checked) => 
                      setSettings({ 
                        ...settings, 
                        notificationTypes: { 
                          ...settings.notificationTypes, 
                          deadlineWarning: checked 
                        } 
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Custom Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-orange-600" />
                  Pesan Reminder Kustom
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-sm font-medium">Pesan Reminder</Label>
                <Input
                  value={settings.reminderMessage}
                  onChange={(e) => 
                    setSettings({ ...settings, reminderMessage: e.target.value })
                  }
                  className="w-full mt-1"
                  placeholder="Masukkan pesan reminder yang personal..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pesan ini akan muncul dalam email dan notifikasi reminder
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Button
            variant="outline"
            onClick={handleTestReminder}
            disabled={!settings.isEnabled}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Test Reminder
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saveSettingsMutation.isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Info Reminder</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Pengaturan ini menggunakan data dari onboarding Anda. Reminder akan membantu Anda 
                  tetap konsisten dalam melakukan update progress sesuai dengan cadence yang telah dipilih 
                  saat onboarding ({onboardingData?.data?.cadence || 'harian'} pada jam {onboardingData?.data?.reminderTime || '17:00'}).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}