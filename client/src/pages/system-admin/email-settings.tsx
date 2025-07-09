import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Send, AlertCircle, CheckCircle, Save, TestTube } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

interface EmailSetting {
  setting_key: string;
  setting_value: string;
  description: string;
  category: string;
  is_active: boolean;
}

export default function EmailSettings() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [testSubject, setTestSubject] = useState("Test Email dari Platform OKR");
  const [testMessage, setTestMessage] = useState("Ini adalah test email untuk memastikan konfigurasi email bekerja dengan baik.");

  const { data: settings, isLoading } = useQuery<EmailSetting[]>({
    queryKey: ['/api/admin/email-settings'],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Record<string, string>) => {
      return apiRequest("PUT", "/api/admin/email-settings", { settings: settingsData });
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Pengaturan email telah diperbarui",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui pengaturan email",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async (testData: { to: string; subject: string; message: string }) => {
      return apiRequest("POST", "/api/admin/email-settings/test", testData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Email Berhasil",
        description: `Email terkirim menggunakan ${data.provider || 'email provider'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Email Gagal",
        description: error.message || "Gagal mengirim test email",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    if (!settings) return;

    const formData = new FormData(document.getElementById('email-settings-form') as HTMLFormElement);
    const settingsData: Record<string, string> = {};
    
    settings.forEach(setting => {
      const value = formData.get(setting.setting_key) as string;
      if (value !== null) {
        settingsData[setting.setting_key] = value;
      }
    });

    updateSettingsMutation.mutate(settingsData);
  };

  const handleTestEmail = () => {
    if (!testEmail || !testSubject || !testMessage) {
      toast({
        title: "Error",
        description: "Harap isi semua field untuk test email",
        variant: "destructive",
      });
      return;
    }

    testEmailMutation.mutate({
      to: testEmail,
      subject: testSubject,
      message: testMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const mailtrapSettings = settings?.filter(s => s.setting_key.startsWith('mailtrap_')) || [];
  const sendgridSettings = settings?.filter(s => s.setting_key.startsWith('sendgrid_')) || [];
  const gmailSettings = settings?.filter(s => s.setting_key.startsWith('gmail_')) || [];
  const smtpSettings = settings?.filter(s => s.setting_key.startsWith('smtp_')) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/system-admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Pengaturan Email</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form id="email-settings-form">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mailtrap Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Mailtrap (Primary)</span>
                </CardTitle>
                <CardDescription>
                  Konfigurasi utama untuk email development dan testing
                  <br />
                  <span className="text-sm text-amber-600">
                    Current: Sandbox (testing only). Untuk email nyata, gunakan Mailtrap Send dengan host: live.smtp.mailtrap.io
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mailtrapSettings.map((setting) => (
                  <div key={setting.setting_key}>
                    <Label htmlFor={setting.setting_key}>
                      {setting.setting_key.replace('mailtrap_', '').replace('_', ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={setting.setting_key}
                      name={setting.setting_key}
                      type={setting.setting_key.includes('pass') ? 'password' : 'text'}
                      defaultValue={setting.setting_value}
                      placeholder={setting.description}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SendGrid Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>SendGrid (Fallback)</span>
                </CardTitle>
                <CardDescription>
                  Konfigurasi SendGrid untuk email production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sendgridSettings.map((setting) => (
                  <div key={setting.setting_key}>
                    <Label htmlFor={setting.setting_key}>
                      {setting.setting_key.replace('sendgrid_', '').replace('_', ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={setting.setting_key}
                      name={setting.setting_key}
                      type={setting.setting_key.includes('api') ? 'password' : 'text'}
                      defaultValue={setting.setting_value}
                      placeholder={setting.description}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gmail Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Gmail (Fallback)</span>
                </CardTitle>
                <CardDescription>
                  Konfigurasi Gmail untuk email fallback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {gmailSettings.map((setting) => (
                  <div key={setting.setting_key}>
                    <Label htmlFor={setting.setting_key}>
                      {setting.setting_key.replace('gmail_', '').replace('_', ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={setting.setting_key}
                      name={setting.setting_key}
                      type={setting.setting_key.includes('pass') ? 'password' : 'text'}
                      defaultValue={setting.setting_value}
                      placeholder={setting.description}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SMTP Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>SMTP Generic (Fallback)</span>
                </CardTitle>
                <CardDescription>
                  Konfigurasi SMTP generic untuk email fallback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {smtpSettings.map((setting) => (
                  <div key={setting.setting_key}>
                    <Label htmlFor={setting.setting_key}>
                      {setting.setting_key.replace('smtp_', '').replace('_', ' ').toUpperCase()}
                    </Label>
                    <Input
                      id={setting.setting_key}
                      name={setting.setting_key}
                      type={setting.setting_key.includes('pass') ? 'password' : 'text'}
                      defaultValue={setting.setting_value}
                      placeholder={setting.description}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Button
              type="button"
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateSettingsMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
            </Button>
          </div>
        </form>

        <Separator className="my-8" />

        {/* Email Provider Setup Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Panduan Konfigurasi Email Provider</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Mailtrap Send (Production)</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Host: live.smtp.mailtrap.io</p>
                  <p>• Port: 587</p>
                  <p>• User: Username dari Mailtrap Send</p>
                  <p>• Password: Password dari Mailtrap Send</p>
                  <p>• Untuk email produksi sesungguhnya</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Gmail SMTP</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Email: akun.gmail.anda@gmail.com</p>
                  <p>• Password: App Password (bukan password Gmail)</p>
                  <p>• Cara buat App Password: Google Account → Security → App passwords</p>
                  <p>• Host: smtp.gmail.com (sudah otomatis terisi)</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">SendGrid</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Daftar di sendgrid.com</p>
                  <p>• API Key: SG.xxxxx (dari SendGrid dashboard)</p>
                  <p>• From: email@domain.anda</p>
                  <p>• Verifikasi domain sender di SendGrid</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Status saat ini:</strong> Menggunakan Mailtrap Sandbox (smtp.mailtrap.io:2525) - hanya untuk testing internal. 
                Email berhasil "dikirim" ke log server tapi tidak sampai ke inbox nyata.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                <strong>Untuk mengirim email sesungguhnya:</strong> Ubah host menjadi "live.smtp.mailtrap.io" dengan port 587 dan kredensial Mailtrap Send yang valid.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Email Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              <span>Test Email</span>
            </CardTitle>
            <CardDescription>
              Kirim test email untuk memastikan konfigurasi email bekerja dengan baik. 
              <br />
              <span className="text-amber-600 font-medium">
                Catatan: Mailtrap sandbox hanya untuk testing (tidak mengirim email nyata). 
                Untuk mengirim email sesungguhnya, gunakan Gmail atau SMTP dengan kredensial yang valid.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="test-email">Email Tujuan</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="test-subject">Subject</Label>
                <Input
                  id="test-subject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Test Email Subject"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="test-message">Pesan</Label>
              <Textarea
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Masukkan pesan test email"
                rows={4}
              />
            </div>
            <Button
              onClick={handleTestEmail}
              disabled={testEmailMutation.isPending}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {testEmailMutation.isPending ? "Mengirim..." : "Kirim Test Email"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}