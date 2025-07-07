import { useState } from "react";
import { ArrowLeft, Bell, Mail, MessageSquare, Target, Calendar, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  category: 'mentions' | 'updates' | 'deadlines' | 'comments';
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'user_mentioned',
      title: 'Disebutkan dalam Komentar',
      description: 'Dapatkan notifikasi ketika Anda disebutkan dalam komentar',
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: true,
      category: 'mentions'
    },
    {
      id: 'comment_added',
      title: 'Komentar Baru',
      description: 'Dapatkan notifikasi untuk komentar baru pada task yang Anda ikuti',
      icon: <MessageSquare className="h-4 w-4" />,
      enabled: true,
      category: 'comments'
    },
    {
      id: 'task_assigned',
      title: 'Task Ditugaskan',
      description: 'Dapatkan notifikasi ketika task baru ditugaskan kepada Anda',
      icon: <Target className="h-4 w-4" />,
      enabled: true,
      category: 'updates'
    },
    {
      id: 'task_deadline',
      title: 'Deadline Task Mendekat',
      description: 'Dapatkan notifikasi 1 hari sebelum deadline task',
      icon: <Calendar className="h-4 w-4" />,
      enabled: true,
      category: 'deadlines'
    },
    {
      id: 'objective_progress',
      title: 'Update Progress Objective',
      description: 'Dapatkan notifikasi ketika ada update progress pada objective yang Anda terlibat',
      icon: <Target className="h-4 w-4" />,
      enabled: false,
      category: 'updates'
    },
    {
      id: 'key_result_update',
      title: 'Update Key Result',
      description: 'Dapatkan notifikasi ketika ada update pada key result yang Anda kelola',
      icon: <Target className="h-4 w-4" />,
      enabled: false,
      category: 'updates'
    }
  ]);

  const [emailNotifications, setEmailNotifications] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);

  const handleToggle = (id: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
    ));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    toast({
      title: "Berhasil",
      description: "Pengaturan notifikasi telah disimpan",
    });
  };

  const categoryIcons = {
    mentions: <MessageSquare className="h-5 w-5 text-blue-600" />,
    comments: <MessageSquare className="h-5 w-5 text-green-600" />,
    updates: <Target className="h-5 w-5 text-purple-600" />,
    deadlines: <Calendar className="h-5 w-5 text-red-600" />
  };

  const categoryTitles = {
    mentions: 'Penyebutan',
    comments: 'Komentar',
    updates: 'Update Progress',
    deadlines: 'Deadline'
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/daily-focus">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Bell className="h-6 w-6 text-blue-600" />
                <span>Pengaturan Notifikasi</span>
              </h1>
              <p className="text-gray-600">Kelola preferensi notifikasi Anda</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Pengaturan Umum</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="browser-notifications" className="text-sm font-medium">
                    Notifikasi Browser
                  </Label>
                  <p className="text-xs text-gray-500">
                    Tampilkan notifikasi di browser ketika ada update
                  </p>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={browserNotifications}
                  onCheckedChange={setBrowserNotifications}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Notifikasi Email
                  </Label>
                  <p className="text-xs text-gray-500">
                    Kirim ringkasan notifikasi ke email Anda
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Types */}
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                  <span>{categoryTitles[category as keyof typeof categoryTitles]}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting, index) => (
                  <div key={setting.id}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          {setting.icon}
                          <Label htmlFor={setting.id} className="text-sm font-medium cursor-pointer">
                            {setting.title}
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {setting.description}
                        </p>
                      </div>
                      <Switch
                        id={setting.id}
                        checked={setting.enabled}
                        onCheckedChange={() => handleToggle(setting.id)}
                      />
                    </div>
                    {index < categorySettings.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Save Button */}
          <div className="flex justify-end space-x-3">
            <Link href="/daily-focus">
              <Button variant="outline">
                Batal
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}