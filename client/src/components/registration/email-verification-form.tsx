import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { EmailVerificationData } from "@/pages/client-registration";

const emailVerificationSchema = z.object({
  verificationCode: z.string()
    .min(6, "Kode verifikasi minimal 6 karakter")
    .max(6, "Kode verifikasi maksimal 6 karakter")
    .regex(/^\d{6}$/, "Kode verifikasi harus berupa 6 digit angka"),
});

interface EmailVerificationFormProps {
  onSubmit: (data: EmailVerificationData) => void;
  email: string;
  isLoading?: boolean;
}

export function EmailVerificationForm({ onSubmit, email, isLoading }: EmailVerificationFormProps) {
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<{ verificationCode: string }>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (data: { verificationCode: string }) => {
    onSubmit({
      verificationCode: data.verificationCode,
      email,
    });
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/registration/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setTimeRemaining(300); // Reset timer
        setCanResend(false);
        form.reset();
      }
    } catch (error) {
      console.error('Error resending verification code:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Verifikasi Email
          </CardTitle>
          <CardDescription>
            Kode verifikasi telah dikirim ke <span className="font-semibold">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Mail className="w-5 h-5" />
                <span className="font-medium">Cek Email Anda</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Kami telah mengirim kode verifikasi 6 digit ke email <strong>{email}</strong>. 
                Silakan cek kotak masuk atau folder spam Anda.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Verifikasi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan 6 digit kode verifikasi"
                          className="text-center text-2xl font-mono tracking-wider"
                          maxLength={6}
                          {...field}
                          onChange={(e) => {
                            // Only allow numbers
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Masukkan kode verifikasi 6 digit yang dikirim ke email Anda
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Timer and resend */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {timeRemaining > 0 ? (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Kode akan kedaluwarsa dalam {formatTime(timeRemaining)}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Kode dapat dikirim ulang</span>
                      </>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={!canResend || isResending}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Kirim Ulang
                      </>
                    )}
                  </Button>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                    disabled={isLoading || !form.watch('verificationCode') || form.watch('verificationCode').length < 6}
                  >
                    {isLoading ? "Memverifikasi..." : "Verifikasi Email"}
                  </Button>
                </div>
              </form>
            </Form>

            {/* Help text */}
            <div className="text-sm text-gray-500 text-center">
              <p>Tidak menerima email? Cek folder spam atau</p>
              <p>pastikan email <strong>{email}</strong> sudah benar</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}