import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvoiceData } from "@/pages/client-registration";
import { Calendar, CreditCard, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentProcessProps {
  invoiceData: InvoiceData | null;
  onPaymentComplete: () => void;
  isLoading?: boolean;
}

export function PaymentProcess({ invoiceData, onPaymentComplete, isLoading }: PaymentProcessProps) {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handlePayWithMidtrans = async () => {
    if (!invoiceData) return;

    setPaymentStatus('processing');
    
    try {
      const response = await fetch(`/api/invoices/${invoiceData.invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initiate payment');
      }

      const { redirect_url } = await response.json();
      
      // Redirect to Midtrans payment page
      window.location.href = redirect_url;
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    }
  };

  const handleManualPayment = () => {
    // Show manual payment instructions
    setPaymentStatus('completed');
    onPaymentComplete();
  };

  if (!invoiceData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Data Invoice Tidak Ditemukan</h3>
        <p className="text-gray-600">Silakan kembali ke langkah sebelumnya</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Invoice {invoiceData.invoiceNumber}
          </CardTitle>
          <CardDescription>
            Invoice berhasil dibuat untuk pendaftaran Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Jatuh Tempo</div>
                <div className="font-medium">{formatDate(invoiceData.dueDate)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm text-gray-600">Total Pembayaran</div>
                <div className="font-medium text-orange-600 text-lg">
                  {formatPrice(invoiceData.totalAmount)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400" />
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Menunggu Pembayaran
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      {paymentStatus === 'processing' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Sedang memproses pembayaran... Anda akan diarahkan ke halaman pembayaran.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'failed' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pembayaran gagal. Silakan coba lagi atau hubungi customer service.
          </AlertDescription>
        </Alert>
      )}

      {paymentStatus === 'completed' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Pembayaran berhasil! Akun Anda akan segera diaktifkan.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Options */}
      {paymentStatus === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Pilih Metode Pembayaran</CardTitle>
            <CardDescription>
              Pilih salah satu metode pembayaran di bawah ini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handlePayWithMidtrans}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              disabled={isLoading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Bayar dengan Midtrans (Kartu Kredit, Transfer Bank, E-Wallet)
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">atau</span>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={handleManualPayment}
              className="w-full"
              disabled={isLoading}
            >
              <FileText className="w-4 h-4 mr-2" />
              Konfirmasi Pembayaran Manual
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Instructions */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Informasi Pembayaran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>Pembayaran Online:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• Kartu Kredit (Visa, Mastercard, JCB)</li>
                <li>• Transfer Bank (BCA, BNI, BRI, Mandiri)</li>
                <li>• E-Wallet (GoPay, OVO, DANA)</li>
                <li>• Minimarket (Indomaret, Alfamart)</li>
              </ul>
            </div>
            <div>
              <strong>Pembayaran Manual:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• Transfer ke rekening perusahaan</li>
                <li>• Konfirmasi melalui email atau WhatsApp</li>
                <li>• Aktivasi akun setelah verifikasi pembayaran</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Butuh Bantuan?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Email:</strong> support@goalsystem.com
            </div>
            <div>
              <strong>WhatsApp:</strong> +62 812-3456-7890
            </div>
            <div>
              <strong>Jam Kerja:</strong> Senin - Jumat, 09:00 - 17:00 WIB
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}