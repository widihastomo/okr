import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertCircle,
  MoreVertical,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InvoiceWithLineItems } from "@shared/schema";
import { CreateInvoiceModal } from "@/components/create-invoice-modal";

interface InvoiceData {
  invoice: {
    id: string;
    invoiceNumber: string;
    amount: string;
    currency: string;
    status: string;
    issueDate: string;
    dueDate: string;
    paidDate: string | null;
    description: string | null;
  };
  organization: {
    id: string;
    name: string;
  };
  subscriptionPlan?: {
    id: string;
    name: string;
  };
  billingPeriod?: {
    id: string;
    periodType: string;
    periodMonths: number;
  };
}

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
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default function InvoiceManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await apiRequest("POST", `/api/invoices/${invoiceId}/mark-paid`, {
        paymentMethod: "manual",
        paidDate: new Date().toISOString()
      });
    },
    onSuccess: () => {
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

  const filteredInvoices = invoices.filter((item: InvoiceData) => {
    const matchesSearch = 
      item.invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.invoice.description && item.invoice.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || item.invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleMarkPaid = (invoiceId: string) => {
    markPaidMutation.mutate(invoiceId);
  };

  const payWithMidtransMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/pay`);
      return response.json();
    },
    onSuccess: (data, invoiceId) => {
      // Redirect to Midtrans payment page
      window.open(data.redirectUrl, '_blank');
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Pembayaran Dimulai",
        description: "Anda akan diarahkan ke halaman pembayaran Midtrans",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Pembayaran",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayWithMidtrans = (invoiceId: string) => {
    payWithMidtransMutation.mutate(invoiceId);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Invoice</h1>
          <p className="text-gray-600 mt-2">Kelola invoice langganan dan pembayaran</p>
        </div>
        <Button 
          onClick={() => setCreateModalOpen(true)}
          className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Invoice</p>
                <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tertunda</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter((item: InvoiceData) => item.invoice.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Dibayar</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter((item: InvoiceData) => item.invoice.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Terlambat</p>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices.filter((item: InvoiceData) => {
                    const dueDate = new Date(item.invoice.dueDate);
                    const now = new Date();
                    return item.invoice.status === 'pending' && dueDate < now;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Tertunda</SelectItem>
                <SelectItem value="sent">Terkirim</SelectItem>
                <SelectItem value="paid">Dibayar</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
                <SelectItem value="refunded">Dikembalikan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Invoice</TableHead>
                  <TableHead>Organisasi</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Tidak ada invoice ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((item: InvoiceData) => {
                    const StatusIcon = statusIcons[item.invoice.status as keyof typeof statusIcons];
                    const isOverdue = item.invoice.status === 'pending' && new Date(item.invoice.dueDate) < new Date();
                    const actualStatus = isOverdue ? 'overdue' : item.invoice.status;
                    
                    return (
                      <TableRow key={item.invoice.id}>
                        <TableCell className="font-medium">
                          <Link href={`/invoices/${item.invoice.id}`} className="text-blue-600 hover:underline">
                            {item.invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{item.organization.name}</TableCell>
                        <TableCell>
                          {item.subscriptionPlan ? item.subscriptionPlan.name : "Custom"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.invoice.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[actualStatus as keyof typeof statusColors]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusLabels[actualStatus as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                            {formatDate(item.invoice.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${item.invoice.id}`} className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Lihat Detail
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              {(item.invoice.status === 'pending' || item.invoice.status === 'sent') && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handlePayWithMidtrans(item.invoice.id)}
                                    disabled={payWithMidtransMutation.isPending}
                                  >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Bayar dengan Midtrans
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleMarkPaid(item.invoice.id)}
                                    disabled={markPaidMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Tandai Dibayar Manual
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </div>
  );
}