import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { apiRequest } from "@/lib/queryClient";
import refokusLogo from "@assets/refokus_1751810404513.png";
import { LoadingButton, PlayfulLoading } from "@/components/ui/playful-loading";
import { usePlayfulLoading, LOADING_CONFIGS } from "@/hooks/usePlayfulLoading";

type RegistrationData = {
  name: string;
  businessName: string;
  whatsappNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Registration() {
  const [formData, setFormData] = useState<RegistrationData>({
    name: "",
    businessName: "",
    whatsappNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Nama diperlukan",
        description: "Silakan masukkan nama lengkap Anda",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.businessName.trim()) {
      toast({
        title: "Nama usaha diperlukan",
        description: "Silakan masukkan nama usaha atau perusahaan Anda",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.whatsappNumber.trim()) {
      toast({
        title: "Nomor WhatsApp diperlukan",
        description: "Silakan masukkan nomor WhatsApp Anda",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email diperlukan",
        description: "Silakan masukkan alamat email Anda",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.includes('@')) {
      toast({
        title: "Format email tidak valid",
        description: "Silakan masukkan alamat email yang valid",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password terlalu pendek",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Konfirmasi password tidak cocok",
        description: "Password dan konfirmasi password harus sama",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          businessName: formData.businessName,
          whatsappNumber: formData.whatsappNumber,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mendaftarkan akun');
      }

      const result = await response.json();
      
      setVerificationSent(true);
      toast({
        title: "Registrasi berhasil!",
        description: "Kode verifikasi telah dikirim ke email Anda. Silakan cek inbox email.",
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Gagal mendaftarkan akun",
        description: error.message || "Terjadi kesalahan saat mendaftarkan akun",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Kode tidak valid",
        description: "Silakan masukkan kode verifikasi 6 digit",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      const response = await apiRequest('POST', '/api/auth/verify-email', {
        email: formData.email,
        code: verificationCode
      });
      
      toast({
        title: "Verifikasi berhasil!",
        description: "Akun Anda telah diaktifkan. Silakan login.",
      });
      
      // Show success screen
      setVerificationSuccess(true);
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Verifikasi gagal",
        description: error.message || "Kode verifikasi tidak valid",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/auth/resend-verification', {
        email: formData.email
      });
      
      toast({
        title: "Kode dikirim ulang",
        description: "Silakan cek email Anda untuk kode verifikasi baru",
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: "Gagal mengirim ulang",
        description: error.message || "Terjadi kesalahan saat mengirim ulang kode",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after verification
  if (verificationSuccess) {
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
                  Akun untuk <span className="font-medium">{formData.email}</span> telah aktif dan siap digunakan.
                </p>
              </div>
              
              <div className="space-y-4">
                <Link href="/login">
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium h-11"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-5 w-5" />
                      <span>Masuk ke Akun</span>
                    </div>
                  </Button>
                </Link>
                
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

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
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
                  Kami telah mengirim kode verifikasi ke:
                </p>
                <p className="font-semibold text-orange-600 text-center">{formData.email}</p>
              </div>
              
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700 block text-center">
                    Masukkan Kode Verifikasi (6 digit)
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={verificationCode}
                      onChange={setVerificationCode}
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
                  type="submit" 
                  isLoading={isVerifying}
                  loadingType="processing"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  disabled={verificationCode.length !== 6}
                >
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5" />
                    <span>Verifikasi Akun</span>
                  </div>
                </LoadingButton>
              </form>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Tidak menerima email? Cek folder spam atau junk
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  {isLoading ? "Mengirim..." : "Kirim Ulang Kode"}
                </Button>
                <div className="pt-4 border-t">
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-orange-600">
                      Kembali ke Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <img 
            src={refokusLogo} 
            alt="Refokus Logo" 
            className="w-32 h-32 mx-auto"
          />
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              Daftar Akun Baru
            </CardTitle>
            <CardDescription className="text-gray-600">
              Mulai kelola goals dan target bisnis Anda dengan mudah
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Nama Usaha */}
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                  Nama Usaha/Perusahaan
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Masukkan nama usaha atau perusahaan"
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">
                  Nomor WhatsApp
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan alamat email Anda"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password (minimal 6 karakter)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Masukkan ulang password Anda"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <LoadingButton 
                type="submit" 
                isLoading={isLoading}
                loadingType="creating"
                className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold transition-all duration-300"
              >
                <div className="flex items-center space-x-2">
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </LoadingButton>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Sudah memiliki akun?{' '}
                <Link href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}