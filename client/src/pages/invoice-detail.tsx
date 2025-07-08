import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { 
  ArrowLeft,
  FileText,
  Download,
  CheckCircle,
  Edit,
  Calendar,
  Building,
  CreditCard,
  Clock,
  AlertCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800", 
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  refunded: "bg-purple-100 text-purple-800"
};

const statusIcons = {
  pending: Clock,
  sent: AlertCircle,
  paid: CheckCircle,
  overdue: XCircle,
  cancelled: XCircle,
  refunded: AlertCircle
};

const statusLabels = {
  pending: "Tertunda",
  sent: "Terkirim", 
  paid: "Dibayar",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
  refunded: "Dikembalikan"
};

function formatCurrency(amount: string) {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoiceData, isLoading, error } = useQuery({
    queryKey: [`/api/invoices/${id}`],
    enabled: !!id,
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/invoices/${id}/mark-paid`, {
        paymentMethod: "manual",
        paidDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Berhasil",
        description: "Invoice berhasil ditandai sebagai dibayar",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-4">Invoice yang Anda cari tidak dapat ditemukan atau Anda tidak memiliki akses.</p>
            <Button asChild>
              <Link href="/invoices">Kembali ke Daftar Invoice</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoiceData) return null;

  const invoice = invoiceData.invoice;
  const organization = invoiceData.organization;
  const subscriptionPlan = invoiceData.subscriptionPlan;
  const billingPeriod = invoiceData.billingPeriod;
  const lineItems = invoiceData.lineItems || [];

  const isOverdue = invoice.status === 'pending' && new Date(invoice.dueDate) < new Date();
  const actualStatus = isOverdue ? 'overdue' : invoice.status;
  const StatusIcon = statusIcons[actualStatus as keyof typeof statusIcons];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600 mt-1">Detail invoice dan informasi pembayaran</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status === 'pending' && (
            <Button 
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {markPaidMutation.isPending ? "Memproses..." : "Tandai Dibayar"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Informasi Invoice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nomor Invoice</label>
                  <p className="text-lg font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge className={statusColors[actualStatus as keyof typeof statusColors]}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusLabels[actualStatus as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Terbit</label>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(invoice.issueDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Jatuh Tempo</label>
                  <p className={`flex items-center ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                {invoice.paidDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Dibayar</label>
                    <p className="text-gray-900 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      {formatDate(invoice.paidDate)}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Jumlah</label>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                </div>
              </div>
              
              {invoice.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Deskripsi</label>
                  <p className="text-gray-900 mt-1">{invoice.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Rincian Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lineItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Tidak ada item detail</p>
                ) : (
                  lineItems.map((item: any, index: number) => (
                    <div key={item.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.description}</h4>
                          {item.periodStart && item.periodEnd && (
                            <p className="text-sm text-gray-500 mt-1">
                              Periode: {formatDate(item.periodStart)} - {formatDate(item.periodEnd)}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>Qty: {item.quantity}</span>
                            <span>Harga Satuan: {formatCurrency(item.unitPrice)}</span>
                            {item.discountPercentage > 0 && (
                              <span className="text-green-600">
                                Diskon: {item.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {parseFloat(invoice.taxAmount || '0') > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pajak ({invoice.taxRate}%):</span>
                    <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Informasi Organisasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nama Organisasi</label>
                <p className="font-medium text-gray-900">{organization?.name || 'N/A'}</p>
              </div>
              {subscriptionPlan && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Paket Langganan</label>
                  <p className="font-medium text-gray-900">{subscriptionPlan.name}</p>
                </div>
              )}
              {billingPeriod && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Periode Billing</label>
                  <p className="font-medium text-gray-900">
                    {billingPeriod.periodType === 'monthly' && 'Bulanan'}
                    {billingPeriod.periodType === 'quarterly' && 'Triwulan'}
                    {billingPeriod.periodType === 'annual' && 'Tahunan'}
                    {billingPeriod.periodType === 'semiannual' && 'Setengah Tahunan'}
                    {!['monthly', 'quarterly', 'annual', 'semiannual'].includes(billingPeriod.periodType) && billingPeriod.periodType}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Mata Uang</label>
                <p className="font-medium text-gray-900">{invoice.currency}</p>
              </div>
              {invoice.paymentMethod && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Metode Pembayaran</label>
                  <p className="font-medium text-gray-900">
                    {invoice.paymentMethod === 'manual' && 'Manual'}
                    {invoice.paymentMethod === 'stripe' && 'Stripe'}
                    {invoice.paymentMethod === 'bank_transfer' && 'Transfer Bank'}
                    {invoice.paymentMethod === 'cash' && 'Tunai'}
                  </p>
                </div>
              )}
              {invoice.status === 'pending' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Invoice ini menunggu pembayaran
                  </p>
                </div>
              )}
              {invoice.status === 'paid' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Invoice ini telah dibayar
                  </p>
                </div>
              )}
              {isOverdue && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <XCircle className="w-4 h-4 inline mr-1" />
                    Invoice ini sudah melewati tanggal jatuh tempo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}