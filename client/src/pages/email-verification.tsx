import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function EmailVerification() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();
  const search = useSearch();

  // Extract email and code from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(search);
    const urlEmail = params.get("email");
    const urlCode = params.get("code");
    
    if (urlEmail) {
      setEmail(decodeURIComponent(urlEmail));
    }
    if (urlCode) {
      setCode(urlCode);
    }
  }, [search]);

  const handleVerification = async () => {
    if (!code || !email) {
      toast({
        title: "Error",
        description: "Kode verifikasi dan email harus diisi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-email", { 
        code: code.trim(), 
        email: email.trim() 
      });
      
      if (response.success) {
        setIsVerified(true);
        toast({
          title: "Berhasil!",
          description: "Email berhasil diverifikasi! Akun Anda sudah aktif.",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memverifikasi email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Verifikasi Berhasil!
            </CardTitle>
            <CardDescription className="text-green-600">
              Akun Anda sudah aktif dan siap digunakan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Selamat datang di Platform OKR! Anda sekarang dapat login dengan akun yang sudah aktif.
              </p>
              <Button 
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
              >
                Login Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Verifikasi Email
          </CardTitle>
          <CardDescription className="text-gray-600">
            {email ? `Masukkan kode verifikasi yang dikirim ke ${email}` : 'Masukkan kode verifikasi yang dikirim ke email Anda'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Kode Verifikasi</Label>
            <Input
              id="code"
              type="text"
              placeholder="Masukkan kode 6 digit"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-white text-center text-lg font-mono"
              maxLength={6}
            />
          </div>

          <Button 
            onClick={handleVerification}
            disabled={isLoading || !code || !email}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Memverifikasi...
              </>
            ) : (
              "Verifikasi Email"
            )}
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              Tidak menerima kode? 
              <button 
                className="text-orange-600 hover:text-orange-800 ml-1 font-medium"
                onClick={() => {
                  toast({
                    title: "Info",
                    description: "Fitur kirim ulang kode akan segera tersedia",
                  });
                }}
              >
                Kirim ulang
              </button>
            </p>
          </div>

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/register'}
              className="w-full"
            >
              Kembali ke Registrasi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}