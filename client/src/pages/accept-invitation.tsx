import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import refokusLogo from "@assets/refokus_1751810711179.png";

const acceptInvitationSchema = z
  .object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z
      .string()
      .min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

export default function AcceptInvitation() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/accept-invitation");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  // Get token from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token undangan tidak ditemukan");
      setIsLoadingInvitation(false);
      return;
    }

    // Fetch invitation details
    const fetchInvitation = async () => {
      try {
        const response = await apiRequest(
          "GET",
          `/api/member-invitations/verify/${token}`,
        );
        const data = await response.json();
        console.log("🔍 Invitation data received:", data);
        setInvitation(data);
      } catch (err) {
        console.error("❌ Error fetching invitation:", err);
        setError("Undangan tidak valid atau telah kedaluwarsa");
      } finally {
        setIsLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      // Split fullName into firstName and lastName
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Ensure we have at least firstName
      if (!firstName) {
        toast({
          title: "Error",
          description: "Nama lengkap diperlukan",
          variant: "destructive",
        });
        return;
      }
      
      console.log("🔍 Sending invitation acceptance data:", {
        firstName,
        lastName,
        password: "[HIDDEN]",
      });
      
      const response = await apiRequest("POST", `/api/member-invitations/accept/${token}`, {
        firstName,
        lastName: lastName || '', // Send empty string instead of undefined
        password: data.password,
      });

      toast({
        title: "Berhasil bergabung",
        description: "Akun Anda telah dibuat dan bergabung dengan tim",
        variant: "default",
      });

      // Redirect to login
      navigate("/login");
    } catch (err: any) {
      console.error("❌ Error accepting invitation:", err);
      toast({
        title: "Error",
        description: err.message || "Gagal menerima undangan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span>Memuat undangan...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Kembali ke Login
              </Button>
            </div>
          </CardContent>
        </Card>
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
          <CardHeader className="text-center pb-8 pt-8">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Terima Undangan Tim
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Bergabung dengan <strong>{invitation?.organization?.name}</strong>
            </p>
            <p className="text-gray-600 mt-1">
              Diundang oleh: {invitation?.inviter?.firstName}{" "}
              {invitation?.inviter?.lastName}
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  {...register("fullName")}
                  className={errors.fullName ? "border-red-500 h-11" : "h-11"}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    {...register("password")}
                    className={errors.password ? "border-red-500 pr-10 h-11" : "pr-10 h-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi password"
                    {...register("confirmPassword")}
                    className={errors.confirmPassword ? "border-red-500 pr-10 h-11" : "pr-10 h-11"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Bergabung dengan Tim"
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center mt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 h-11"
              >
                Sudah punya akun? Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
