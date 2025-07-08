import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InvoicePaymentFinish() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  // Get order_id from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId);
    } else {
      setPaymentStatus('failed');
    }
  }, [orderId]);

  const checkPaymentStatus = async (orderId: string) => {
    try {
      // Check payment status from our backend
      const response = await apiRequest("GET", `/api/midtrans/payment-status/${orderId}`);
      
      setPaymentDetails(response);
      
      // Update payment status based on transaction status
      switch (response.transaction_status) {
        case 'settlement':
        case 'capture':
          setPaymentStatus('success');
          toast({
            title: "Pembayaran Berhasil!",
            description: "Invoice telah dibayar dan status telah diperbarui.",
          });
          break;
        case 'pending':
          setPaymentStatus('pending');
          break;
        case 'deny':
        case 'cancel':
        case 'expire':
        case 'failure':
          setPaymentStatus('failed');
          break;
        default:
          setPaymentStatus('pending');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
      toast({
        title: "Error",
        description: "Gagal memeriksa status pembayaran. Silakan periksa kembali di halaman invoice.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-gray-400 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return "Pembayaran Berhasil!";
      case 'pending':
        return "Pembayaran Sedang Diproses";
      case 'failed':
        return "Pembayaran Gagal";
      default:
        return "Memeriksa Status Pembayaran...";
    }
  };

  const getStatusDescription = () => {
    switch (paymentStatus) {
      case 'success':
        return "Invoice telah berhasil dibayar. Status invoice telah diperbarui secara otomatis.";
      case 'pending':
        return "Pembayaran Anda sedang diproses. Status akan diperbarui otomatis setelah konfirmasi dari bank.";
      case 'failed':
        return "Pembayaran tidak berhasil. Silakan coba lagi atau hubungi customer service.";
      default:
        return "Mohon tunggu sebentar...";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl">{getStatusTitle()}</CardTitle>
          <CardDescription>
            {getStatusDescription()}
          </CardDescription>
        </CardHeader>
        
        {paymentDetails && (
          <CardContent className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Detail Pembayaran</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono">{paymentDetails.order_id}</span>
                </div>
                {paymentDetails.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono">{paymentDetails.transaction_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah:</span>
                  <span>Rp {parseInt(paymentDetails.gross_amount || '0').toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Metode:</span>
                  <span className="capitalize">{paymentDetails.payment_type}</span>
                </div>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate('/invoices')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Daftar Invoice
            </Button>
            
            {paymentStatus === 'failed' && (
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Periksa Status Lagi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}