import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Mail, AlertCircle, ArrowRight, RefreshCw, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiRequest } from "@/lib/queryClient";
import { LoadingButton } from "@/components/ui/playful-loading";
import refokusLogo from "@assets/refokus_1751810711179.png";

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

  const handleResendCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email harus diisi untuk mengirim ulang kode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/resend-verification-code", { 
        email: email.trim() 
      });
      
      toast({
        title: "Kode dikirim ulang",
        description: "Silakan cek email Anda untuk kode verifikasi baru",
      });
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengirim ulang kode",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <img 
              src={refokusLogo} 
              alt="Refokus Logo" 
              className="w-32 h-32 mx-auto"
            />
          </div>
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Selamat!
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Akun Anda berhasil diverifikasi dan telah aktif
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-green-800 mb-2">
                  Verifikasi Email Berhasil
                </h3>
                <p className="text-sm text-green-700">
                  Akun untuk <span className="font-medium">{email}</span> telah aktif dan siap digunakan.
                </p>
              </div>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium h-11"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-5 w-5" />
                    <span>Masuk ke Akun</span>
                  </div>
                </Button>
                
                <p className="text-sm text-gray-600">
                  Anda dapat langsung masuk menggunakan email dan password yang telah dibuat
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img 
            src={refokusLogo} 
            alt="Refokus Logo" 
            className="h-12 w-auto mx-auto"
          />
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verifikasi Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              Kode verifikasi telah dikirim ke email Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 rounded-lg p-6 mb-6">
              <Mail className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <p className="text-sm text-gray-700 mb-2 text-center">
                {email ? 'Kami telah mengirim kode verifikasi ke:' : 'Masukkan email dan kode verifikasi yang dikirim ke email Anda'}
              </p>
              {email && (
                <p className="font-semibold text-orange-600 text-center">{email}</p>
              )}
            </div>
            
            <div className="space-y-6">
              {!email && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700 block text-center">
                  Masukkan Kode Verifikasi (6 digit)
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    value={code}
                    onChange={setCode}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <LoadingButton
                onClick={handleVerification}
                loading={isLoading}
                loadingType="processing"
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11"
                disabled={code.length !== 6 || (!email && !code)}
              >
                Verifikasi Email
              </LoadingButton>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600 mb-2">
                  Tidak menerima kode?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={isLoading || !email}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Kirim Ulang Kode
                </Button>
                
                <div className="pt-2 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/login'}
                    className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Login
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}