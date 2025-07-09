import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, User, Building, Phone, Mail, Lock } from "lucide-react";
import { UserRegistrationData } from "@/pages/client-registration";

const userRegistrationSchema = z.object({
  userName: z.string().min(2, "Nama pengguna minimal 2 karakter"),
  businessName: z.string().min(2, "Nama usaha minimal 2 karakter"),
  whatsappNumber: z.string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor WhatsApp hanya boleh berisi angka, +, -, dan spasi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

interface UserRegistrationFormProps {
  onSubmit: (data: UserRegistrationData) => void;
  initialData?: UserRegistrationData | null;
  isLoading?: boolean;
}

export function UserRegistrationForm({ onSubmit, initialData, isLoading }: UserRegistrationFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<UserRegistrationData>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: initialData || {
      userName: "",
      businessName: "",
      whatsappNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (data: UserRegistrationData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informasi Pengguna
          </CardTitle>
          <CardDescription>
            Masukkan informasi dasar pengguna dan usaha Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nama Pengguna
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama pengguna" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Nama Usaha
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama usaha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Nomor WhatsApp Aktif
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: +62812345678" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nomor WhatsApp yang aktif untuk komunikasi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Masukkan email" {...field} />
                      </FormControl>
                      <FormDescription>
                        Kode verifikasi akan dikirim ke email ini
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Minimal 8 karakter
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Konfirmasi Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Ulangi password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Mengirim..." : "Kirim Kode Verifikasi"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}