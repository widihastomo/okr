import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  registerSchema,
  type LoginData,
  type RegisterData,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      // Clear logout flag immediately on successful login
      localStorage.removeItem("isLoggedOut");

      toast({
        title: "Berhasil masuk",
        description: "Selamat datang kembali!",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Small delay to ensure queries are invalidated
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error: any) => {
      console.log("Login error:", error);
      toast({
        title: "Gagal masuk",
        description: error.message || "Email atau password salah",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      return apiRequest("POST", "/api/auth/register", data);
    },
    onSuccess: () => {
      // Clear logout flag immediately on successful registration
      localStorage.removeItem("isLoggedOut");

      toast({
        title: "Berhasil mendaftar",
        description: "Akun Anda telah dibuat dan otomatis masuk",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Gagal mendaftar",
        description: error.message || "Terjadi kesalahan saat mendaftar",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginData) => {
    console.log("Login attempt with data:", data);
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-full flex items-center justify-center">
              {isRegister ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isRegister ? "Buat Akun Baru" : "Masuk ke Akun Anda"}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {isRegister
                  ? "Daftar untuk mulai mengelola OKR tim Anda"
                  : "Kelola tujuan dan pencapaian tim dengan mudah"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {isRegister ? (
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nama Depan</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      {...registerForm.register("firstName")}
                      className="h-11"
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-sm text-red-600">
                        {registerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nama Belakang</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      {...registerForm.register("lastName")}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      {...registerForm.register("email")}
                      className="pl-10 h-11"
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
                      placeholder="Minimal 6 karakter"
                      {...registerForm.register("password")}
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
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending
                    ? "Mendaftar..."
                    : "Daftar Sekarang"}
                </Button>
              </form>
            ) : (
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
                      placeholder="john@company.com"
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

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Masuk..." : "Masuk"}
                </Button>
              </form>
            )}

            <Separator />

            {/* Demo Accounts Section */}
            {!isRegister && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-blue-900">
                  Akun Demo untuk Testing:
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white p-2 rounded border">
                    <div>
                      <div className="font-medium text-gray-900">
                        Admin User
                      </div>
                      <div className="text-gray-600">admin@example.com</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loginForm.setValue("email", "admin@example.com");
                        loginForm.setValue("password", "password123");
                      }}
                      className="text-xs"
                    >
                      Isi Otomatis
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border">
                    <div>
                      <div className="font-medium text-gray-900">
                        Manager User
                      </div>
                      <div className="text-gray-600">manager@example.com</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loginForm.setValue("email", "manager@example.com");
                        loginForm.setValue("password", "password123");
                      }}
                      className="text-xs"
                    >
                      Isi Otomatis
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border">
                    <div>
                      <div className="font-medium text-gray-900">
                        Member User
                      </div>
                      <div className="text-gray-600">john@example.com</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        loginForm.setValue("email", "john@example.com");
                        loginForm.setValue("password", "password123");
                      }}
                      className="text-xs"
                    >
                      Isi Otomatis
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  Semua akun demo menggunakan password:{" "}
                  <span className="font-mono bg-blue-100 px-1 rounded">
                    password123
                  </span>
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setIsRegister(!isRegister);
                  loginForm.reset();
                  registerForm.reset();
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {isRegister ? "Masuk di sini" : "Daftar sekarang"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
