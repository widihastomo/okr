import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, Lock, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import refokusLogo from "@assets/refokus_1751810711179.png";
import { LoadingButton } from "@/components/ui/playful-loading";
import { usePlayfulLoading, LOADING_CONFIGS } from "@/hooks/usePlayfulLoading";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login berhasil",
        description: "Selamat datang!",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      // Check if error is due to email not verified
      if (error.message.includes("EMAIL_NOT_VERIFIED") || error.message.includes("Email belum diverifikasi")) {
        const email = loginForm.getValues("email");
        setVerificationEmail(email);
        setShowEmailVerification(true);
        toast({
          title: "Email belum diverifikasi",
          description: "Silakan masukkan kode verifikasi yang dikirim ke email Anda",
          variant: "default",
        });
        return;
      }
      
      toast({
        title: "Login gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleEmailVerification = async () => {
    if (!verificationEmail || verificationCode.length !== 6) {
      toast({
        title: "Kode tidak valid",
        description: "Silakan masukkan kode verifikasi 6 digit",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-email", {
        email: verificationEmail,
        code: verificationCode,
      });
      
      if (response.ok) {
        toast({
          title: "Email berhasil diverifikasi",
          description: "Silakan login kembali",
        });
        setShowEmailVerification(false);
        setVerificationCode("");
        setVerificationEmail("");
      } else {
        const error = await response.json();
        toast({
          title: "Verifikasi gagal",
          description: error.message || "Kode verifikasi salah",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verifikasi gagal",
        description: "Terjadi kesalahan saat verifikasi",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!verificationEmail) return;

    try {
      const response = await apiRequest("POST", "/api/auth/resend-verification", {
        email: verificationEmail,
      });
      
      if (response.ok) {
        toast({
          title: "Kode baru dikirim",
          description: "Silakan cek email Anda",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Gagal mengirim kode",
          description: error.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Gagal mengirim kode",
        description: "Terjadi kesalahan saat mengirim kode",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={refokusLogo}
            alt="Refokus Logo"
            className="h-12 w-auto mx-auto"
          />
        </div>
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {showEmailVerification ? "Verifikasi Email" : "Masuk ke Akun Anda"}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {showEmailVerification ? "Masukkan kode verifikasi yang dikirim ke email Anda" : "Kelola objective dan angka target Anda"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {showEmailVerification ? (
              // Email Verification Form
              <div className="space-y-6">
                <div className="bg-orange-50 rounded-lg p-6">
                  <Mail className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-700 mb-2 text-center">
                    Kode verifikasi telah dikirim ke:
                  </p>
                  <p className="font-semibold text-orange-600 text-center">{verificationEmail}</p>
                </div>
                
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
                  onClick={handleEmailVerification}
                  loading={isVerifying}
                  loadingType="processing"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11"
                  disabled={verificationCode.length !== 6}
                >
                  Verifikasi Email
                </LoadingButton>
                
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Tidak menerima kode?
                  </p>
                  <Button
                    variant="ghost"
                    onClick={handleResendCode}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Kirim Ulang Kode
                  </Button>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEmailVerification(false);
                        setVerificationCode("");
                        setVerificationEmail("");
                      }}
                      className="text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Kembali ke Login
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // Login Form
              <>
                <form
                  onSubmit={loginForm.handleSubmit(handleLogin)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Masukkan email Anda"
                        {...loginForm.register("email")}
                        className="pl-10 h-11"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-600">
                        {loginForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password Anda"
                        {...loginForm.register("password")}
                        className="pl-10 pr-10 h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-600">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <LoadingButton
                      type="submit"
                      isLoading={loginMutation.isPending}
                      loadingType="processing"
                      className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium"
                    >
                      Masuk
                    </LoadingButton>
                  </div>
                </form>

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">Belum punya akun?</p>
                  <Link
                    href="/register"
                    className="text-orange-600 hover:text-orange-700 font-medium hover:underline text-sm block"
                  >
                    Daftar Organisasi Baru
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
