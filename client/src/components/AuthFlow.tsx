import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  User,
  Building,
  Phone,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Gift,
  XCircle,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
// Button will be replaced with Button
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import refokusLogo from "@assets/refokus_1751810711179.png";
import { prefetchAuthData } from "@/lib/auth-prefetch";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  businessName: z.string().min(2, "Nama bisnis minimal 2 karakter"),
  whatsappNumber: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .max(15, "Nomor WhatsApp maksimal 15 digit")
    .regex(
      /^(\+62|62|0)8[1-9][0-9]{6,10}$/,
      "Format nomor handphone Indonesia tidak valid. Contoh: 08123456789, +628123456789, atau 628123456789",
    ),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  invitationCode: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
});

const resetPasswordSchema = z
  .object({
    code: z.string().min(6, "Kode verifikasi harus 6 digit"),
    newPassword: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Password minimal 6 karakter"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export type AuthFlowStep =
  | "login"
  | "register"
  | "email-verification"
  | "verification-success"
  | "forgot-password"
  | "reset-password"
  | "reset-success";

interface AuthFlowProps {
  initialStep?: AuthFlowStep;
  onSuccess?: () => void;
}

export default function AuthFlow({
  initialStep = "login",
  onSuccess,
}: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthFlowStep>(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [showInvitationCode, setShowInvitationCode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [invitationValidation, setInvitationValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    message: string;
  }>({ status: "idle", message: "" });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Form instances
  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      businessName: "",
      whatsappNumber: "",
      email: "",
      password: "",
      invitationCode: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const resetPasswordForm = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  // Debounced invitation code validation
  const validateInvitationCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setInvitationValidation({ status: "idle", message: "" });
      return;
    }

    setInvitationValidation({
      status: "validating",
      message: "Memvalidasi kode...",
    });

    try {
      const response = await apiRequest(
        "POST",
        "/api/referral-codes/validate-registration",
        {
          code: code.toUpperCase(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        setInvitationValidation({
          status: "invalid",
          message: error.message || "Kode undangan tidak valid",
        });
        return;
      }

      const result = await response.json();

      if (result.valid) {
        setInvitationValidation({
          status: "valid",
          message: result.message || "Kode undangan valid",
        });
      } else {
        setInvitationValidation({
          status: "invalid",
          message: result.message || "Kode undangan tidak valid",
        });
      }
    } catch (error) {
      setInvitationValidation({
        status: "invalid",
        message: "Gagal memvalidasi kode undangan",
      });
    }
  }, []);

  // Debounce validation
  useEffect(() => {
    const invitationCode = registerForm.watch("invitationCode");
    if (!showInvitationCode || !invitationCode) {
      setInvitationValidation({ status: "idle", message: "" });
      return;
    }

    const timer = setTimeout(() => {
      validateInvitationCode(invitationCode);
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [
    registerForm.watch("invitationCode"),
    showInvitationCode,
    validateInvitationCode,
  ]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login gagal");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      // Clear logout flag on successful login
      localStorage.removeItem("isLoggedOut");

      // Invalidate auth cache to force refresh with new user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      // Start prefetching data in background for faster page loads
      prefetchAuthData();

      toast({
        title: "Login berhasil",
        description: "Selamat datang!",
        variant: "success",
      });

      // Immediate redirect to "/" for fastest user experience
      // Onboarding check will happen in App.tsx after redirect
      navigate("/");

      // Call onSuccess callback if provided
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      if (
        error.message.includes("EMAIL_NOT_VERIFIED") ||
        error.message.includes("Email belum diverifikasi")
      ) {
        const email = loginForm.getValues("email");
        setVerificationEmail(email);
        setCurrentStep("email-verification");
        toast({
          title: "Email belum diverifikasi",
          description:
            "Silakan masukkan kode verifikasi yang dikirim ke email Anda",
          variant: "destructive",
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

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registrasi gagal");
      }
      return response.json();
    },
    onSuccess: () => {
      const email = registerForm.getValues("email");
      setVerificationEmail(email);
      setCurrentStep("email-verification");
      toast({
        title: "Registrasi berhasil",
        description: "Kode verifikasi telah dikirim ke email Anda",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registrasi gagal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordData) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/forgot-password",
        data,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengirim kode reset");
      }
      return response.json();
    },
    onSuccess: () => {
      const email = forgotPasswordForm.getValues("email");
      setVerificationEmail(email);
      setCurrentStep("reset-password");
      toast({
        title: "Kode reset dikirim",
        description: "Silakan cek email Anda untuk kode reset password",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal mengirim kode reset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordData) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", {
        email: verificationEmail,
        code: data.code,
        newPassword: data.newPassword,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal reset password");
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep("reset-success");
      toast({
        title: "Password berhasil direset",
        description: "Silakan login dengan password baru Anda",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Email verification handler
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
        // Clear logout flag and invalidate auth cache
        localStorage.removeItem("isLoggedOut");
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

        // Set flags for new user flow - redirect to onboarding first
        localStorage.removeItem("onboarding-completed");
        localStorage.removeItem("welcome-screen-shown");

        toast({
          title: "Email berhasil diverifikasi",
          description: "Akun Anda sudah aktif! Mari lengkapi profil perusahaan",
          variant: "success",
        });

        // Redirect to onboarding page for new users
        navigate("/onboarding");

        // Call onSuccess callback if provided
        if (onSuccess) onSuccess();
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

  // Resend verification code
  const handleResendCode = async () => {
    if (!verificationEmail) return;

    setIsResendingCode(true);
    try {
      const response = await apiRequest(
        "POST",
        "/api/auth/resend-verification",
        {
          email: verificationEmail,
        },
      );

      if (response.ok) {
        toast({
          title: "Kode baru dikirim",
          description: "Silakan cek email Anda",
          variant: "success",
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
    } finally {
      setIsResendingCode(false);
    }
  };

  // Get step configuration
  const getStepConfig = () => {
    switch (currentStep) {
      case "login":
        return {
          title: "Masuk ke Akun Anda",
          description: "Ubah tujuan menjadi aksi nyata yang terukur",
          showBackButton: false,
        };
      case "register":
        return {
          title: "Daftar Organisasi Baru",
          description: "Ubah tujuan menjadi aksi nyata yang terukur",
          showBackButton: true,
        };
      case "email-verification":
        return {
          title: "Verifikasi Email",
          description: "Masukkan kode verifikasi yang dikirim ke email Anda",
          showBackButton: true,
        };
      case "verification-success":
        return {
          title: "Verifikasi Berhasil",
          description: "Akun Anda sudah aktif dan siap digunakan",
          showBackButton: false,
        };
      case "forgot-password":
        return {
          title: "Lupa Password",
          description: "Masukkan email untuk mendapatkan kode reset password",
          showBackButton: true,
        };
      case "reset-password":
        return {
          title: "Reset Password",
          description: "Masukkan kode verifikasi dan password baru",
          showBackButton: true,
        };
      case "reset-success":
        return {
          title: "Password Berhasil Direset",
          description: "Silakan login dengan password baru Anda",
          showBackButton: false,
        };
      default:
        return {
          title: "Autentikasi",
          description: "Kelola akses akun Anda",
          showBackButton: false,
        };
    }
  };

  const stepConfig = getStepConfig();

  // Handle form submissions
  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  const handleForgotPassword = (data: ForgotPasswordData) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleResetPassword = (data: ResetPasswordData) => {
    resetPasswordMutation.mutate(data);
  };

  // Navigate between steps
  const navigateToStep = (step: AuthFlowStep) => {
    setCurrentStep(step);
    setVerificationCode("");
    setResetCode("");
  };

  const renderBackButton = () => {
    if (!stepConfig.showBackButton) return null;

    let backStep: AuthFlowStep = "login";
    if (currentStep === "register") backStep = "login";
    else if (currentStep === "email-verification") {
      backStep =
        verificationEmail === loginForm.getValues("email")
          ? "login"
          : "register";
    } else if (currentStep === "forgot-password") backStep = "login";
    else if (currentStep === "reset-password") backStep = "forgot-password";

    return (
      <Button
        variant="outline"
        onClick={() => navigateToStep(backStep)}
        className="w-full text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 mb-4 h-11"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "login":
        return (
          <div className="space-y-6">
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
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
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
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
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
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Masuk
                    </>
                  )}
                </Button>
              </div>
            </form>
            <div className="text-center space-y-3">
              <Button
                variant="ghost"
                onClick={() => navigateToStep("forgot-password")}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Lupa Password?
              </Button>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm text-gray-600 mb-2">Belum punya akun?</p>
                <Button
                  variant="outline"
                  onClick={() => navigateToStep("register")}
                  className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                >
                  Daftar Sekarang
                </Button>
              </div>
            </div>
          </div>
        );

      case "register":
        return (
          <div className="space-y-6">
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    placeholder="Masukkan nama lengkap Anda"
                    {...registerForm.register("name")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Nama Bisnis</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="businessName"
                    placeholder="Masukkan nama bisnis/organisasi"
                    {...registerForm.register("businessName")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {registerForm.formState.errors.businessName && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">Nomor WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="whatsappNumber"
                    placeholder="08123456789 atau +628123456789"
                    {...registerForm.register("whatsappNumber")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {registerForm.formState.errors.whatsappNumber && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.whatsappNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    {...registerForm.register("email")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.email.message}
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
                    placeholder="Masukkan password (minimal 6 karakter)"
                    {...registerForm.register("password")}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
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
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Invitation Code Toggle */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowInvitationCode(!showInvitationCode)}
                  className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-orange-600 transition-colors duration-200"
                >
                  <span>Punya kode undangan?</span>
                  {showInvitationCode ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showInvitationCode && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="invitationCode">
                      Kode Undangan (Opsional)
                    </Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="invitationCode"
                        type="text"
                        placeholder="Masukkan kode undangan"
                        {...registerForm.register("invitationCode")}
                        className={`pl-10 pr-10 h-11 transition-all duration-200 uppercase ${
                          invitationValidation.status === "valid"
                            ? "border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            : invitationValidation.status === "invalid"
                              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                              : "border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                        }`}
                        style={{ textTransform: "uppercase" }}
                      />
                      {/* Validation indicator */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {invitationValidation.status === "validating" && (
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        )}
                        {invitationValidation.status === "valid" && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {invitationValidation.status === "invalid" && (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    {/* Validation message */}
                    {invitationValidation.status !== "idle" &&
                      invitationValidation.message && (
                        <div
                          className={`flex items-center gap-2 text-sm ${
                            invitationValidation.status === "valid"
                              ? "text-green-600"
                              : invitationValidation.status === "invalid"
                                ? "text-red-600"
                                : "text-orange-600"
                          }`}
                        >
                          {invitationValidation.status === "validating" && (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          )}
                          {invitationValidation.status === "valid" && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {invitationValidation.status === "invalid" && (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{invitationValidation.message}</span>
                        </div>
                      )}

                    {registerForm.formState.errors.invitationCode && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.invitationCode.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Terms of Service */}
              <div className="pt-2 pb-3">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  Dengan klik tombol daftar, saya telah membaca dan menyetujui
                  serta tunduk kepada{" "}
                  <button
                    type="button"
                    onClick={() => window.open("/terms-of-service", "_blank")}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Ketentuan Layanan Refokus
                  </button>
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mendaftar...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-4 w-4" />
                      Daftar Akun
                    </>
                  )}
                </Button>
              </div>
            </form>

            {renderBackButton()}
          </div>
        );

      case "email-verification":
        return (
          <div className="space-y-6">
            <div className="bg-orange-50 rounded-lg p-6">
              <Mail className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <p className="text-sm text-gray-700 mb-2 text-center">
                Kode verifikasi telah dikirim ke:
              </p>
              <p className="font-semibold text-orange-600 text-center">
                {verificationEmail}
              </p>
            </div>

            <div className="space-y-4">
              <Label
                htmlFor="verificationCode"
                className="text-sm font-medium text-gray-700 block text-center"
              >
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

            <Button
              onClick={handleEmailVerification}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verifikasi Email
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Tidak menerima kode?</p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResendingCode}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                {isResendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Kirim Ulang Kode
                  </>
                )}
              </Button>
            </div>

            {renderBackButton()}
          </div>
        );

      case "verification-success":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-600">Selamat!</h3>
              <p className="text-gray-600">
                Email Anda telah berhasil diverifikasi. Akun Anda sudah aktif
                dan siap digunakan.
              </p>
            </div>

            <Button
              onClick={() => {
                // This case should not happen since verification now redirects directly
                // But keeping as fallback
                navigateToStep("login");
              }}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium h-11"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Lanjut ke Login
            </Button>
          </div>
        );

      case "forgot-password":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-700">
                Masukkan email Anda untuk mendapatkan kode reset password
              </p>
            </div>

            <form
              onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
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
                    {...forgotPasswordForm.register("email")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={forgotPasswordMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium"
              >
                {forgotPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Kode Reset"
                )}
              </Button>
            </form>

            {renderBackButton()}
          </div>
        );

      case "reset-password":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-700 mb-2 text-center">
                Kode reset telah dikirim ke:
              </p>
              <p className="font-semibold text-blue-600 text-center">
                {verificationEmail}
              </p>
            </div>

            <form
              onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="code">Kode Verifikasi</Label>
                <Input
                  id="code"
                  placeholder="Masukkan kode 6 digit"
                  {...resetPasswordForm.register("code")}
                  className="h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                />
                {resetPasswordForm.formState.errors.code && (
                  <p className="text-sm text-red-600">
                    {resetPasswordForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    {...resetPasswordForm.register("newPassword")}
                    className="pl-10 pr-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
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
                {resetPasswordForm.formState.errors.newPassword && (
                  <p className="text-sm text-red-600">
                    {resetPasswordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ulangi password baru"
                    {...resetPasswordForm.register("confirmPassword")}
                    className="pl-10 h-11 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  />
                </div>
                {resetPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {resetPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={resetPasswordMutation.isPending}
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium"
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mereset...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>

            {renderBackButton()}
          </div>
        );

      case "reset-success":
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-orange-600">
                Password Berhasil Direset!
              </h3>
              <p className="text-gray-600">
                Password Anda telah berhasil direset. Silakan login dengan
                password baru Anda.
              </p>
            </div>

            <Button
              onClick={() => navigateToStep("login")}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Lanjut ke Login
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

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

        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {stepConfig.title}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {stepConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">{renderStepContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}
