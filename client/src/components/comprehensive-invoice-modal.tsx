import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Gift, Package, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ComprehensiveInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
}

interface CustomLineItem {
  type: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  metadata?: any;
}

export default function ComprehensiveInvoiceModal({
  isOpen,
  onClose,
  organizationId,
  organizationName,
}: ComprehensiveInvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedReferralCodeId, setSelectedReferralCodeId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [customLineItems, setCustomLineItems] = useState<CustomLineItem[]>([]);

  // Get organization subscriptions
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["/api/admin/organization-subscriptions", organizationId],
    enabled: isOpen && !!organizationId,
  });

  // Get organization addon subscriptions
  const { data: addonSubscriptions = [] } = useQuery({
    queryKey: ["/api/admin/organization-addon-subscriptions", organizationId],
    enabled: isOpen && !!organizationId,
  });

  // Get available referral codes
  const { data: referralCodes = [] } = useQuery({
    queryKey: ["/api/referral-codes/available"],
    enabled: isOpen,
  });

  const selectedSubscription = subscriptions.find((sub: any) => sub.id === selectedSubscriptionId);
  const selectedAddons = addonSubscriptions.filter((addon: any) => 
    selectedAddonIds.includes(addon.id)
  );

  const calculateTotals = () => {
    let subtotal = 0;
    
    // Add subscription cost
    if (selectedSubscription?.billingPeriod?.price) {
      subtotal += parseFloat(selectedSubscription.billingPeriod.price);
    }
    
    // Add addon costs
    selectedAddons.forEach((addon: any) => {
      if (addon.addon?.price) {
        subtotal += parseFloat(addon.addon.price) * addon.quantity;
      }
    });
    
    // Add custom line items
    customLineItems.forEach(item => {
      subtotal += parseFloat(item.totalPrice || "0");
    });
    
    // Calculate referral discount
    let referralDiscount = 0;
    const selectedReferralCode = referralCodes.find((code: any) => code.id === selectedReferralCodeId);
    if (selectedReferralCode && selectedReferralCode.isActive) {
      switch (selectedReferralCode.discountType) {
        case "percentage":
          referralDiscount = (subtotal * parseFloat(selectedReferralCode.discountValue)) / 100;
          break;
        case "fixed_amount":
          referralDiscount = parseFloat(selectedReferralCode.discountValue);
          break;
        case "free_months":
          referralDiscount = selectedSubscription?.billingPeriod?.price 
            ? parseFloat(selectedSubscription.billingPeriod.price) 
            : 0;
          break;
      }
      referralDiscount = Math.min(referralDiscount, subtotal);
    }
    
    const discountedSubtotal = subtotal - referralDiscount;
    const taxRate = 11; // 11% PPN
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + taxAmount;
    
    return {
      subtotal,
      referralDiscount,
      discountedSubtotal,
      taxAmount,
      total
    };
  };

  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/invoices/generate-comprehensive", data);
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Invoice komprehensif berhasil dibuat",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: error.message || "Gagal membuat invoice",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedSubscriptionId("");
    setSelectedAddonIds([]);
    setSelectedReferralCodeId("");
    setDescription("");
    setCustomLineItems([]);
  };

  const handleSubmit = () => {
    if (!selectedSubscriptionId) {
      toast({
        title: "Error",
        description: "Pilih subscription terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    const data = {
      organizationId,
      subscriptionId: selectedSubscriptionId,
      addonSubscriptionIds: selectedAddonIds,
      referralCodeId: selectedReferralCodeId || null,
      description,
      customLineItems,
    };

    generateInvoiceMutation.mutate(data);
  };

  const addCustomLineItem = () => {
    setCustomLineItems([
      ...customLineItems,
      {
        type: "fee",
        description: "",
        quantity: 1,
        unitPrice: "0",
        totalPrice: "0",
      },
    ]);
  };

  const removeCustomLineItem = (index: number) => {
    setCustomLineItems(customLineItems.filter((_, i) => i !== index));
  };

  const updateCustomLineItem = (index: number, field: keyof CustomLineItem, value: any) => {
    const updated = [...customLineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto calculate total price
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : updated[index].quantity;
      const unitPrice = field === "unitPrice" ? value : updated[index].unitPrice;
      updated[index].totalPrice = (quantity * parseFloat(unitPrice || "0")).toString();
    }
    
    setCustomLineItems(updated);
  };

  const toggleAddonSelection = (addonId: string) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter(id => id !== addonId));
    } else {
      setSelectedAddonIds([...selectedAddonIds, addonId]);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Buat Invoice Komprehensif - {organizationName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pilih Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih subscription..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.map((sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.subscriptionPlan?.name} - {sub.billingPeriod?.periodType} 
                        ({formatCurrency(parseFloat(sub.billingPeriod?.price || "0"))})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Addon Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pilih Add-ons (Opsional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {addonSubscriptions.map((addon: any) => (
                    <div key={addon.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        checked={selectedAddonIds.includes(addon.id)}
                        onCheckedChange={() => toggleAddonSelection(addon.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{addon.addon?.name}</div>
                        <div className="text-sm text-gray-500">
                          Qty: {addon.quantity} × {formatCurrency(parseFloat(addon.addon?.price || "0"))}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {formatCurrency(parseFloat(addon.addon?.price || "0") * addon.quantity)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Referral Code Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Kode Referral (Opsional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedReferralCodeId} onValueChange={setSelectedReferralCodeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kode referral..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada</SelectItem>
                    {referralCodes.map((code: any) => (
                      <SelectItem key={code.id} value={code.id}>
                        {code.code} - {code.discountType === "percentage" 
                          ? `${code.discountValue}%` 
                          : code.discountType === "fixed_amount"
                          ? formatCurrency(parseFloat(code.discountValue))
                          : `${code.discountValue} bulan gratis`
                        }
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Custom Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Item Tambahan
                  <Button type="button" variant="outline" size="sm" onClick={addCustomLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customLineItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Belum ada item tambahan</p>
                ) : (
                  <div className="space-y-4">
                    {customLineItems.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label>Deskripsi</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateCustomLineItem(index, "description", e.target.value)}
                              placeholder="Deskripsi item..."
                            />
                          </div>
                          <div>
                            <Label>Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateCustomLineItem(index, "quantity", parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </div>
                          <div>
                            <Label>Harga Satuan</Label>
                            <Input
                              value={item.unitPrice}
                              onChange={(e) => updateCustomLineItem(index, "unitPrice", e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={formatCurrency(parseFloat(item.totalPrice || "0"))}
                                disabled
                                className="bg-gray-50"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomLineItem(index)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <Label htmlFor="description">Deskripsi Invoice (Opsional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi tambahan untuk invoice..."
                rows={3}
              />
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                
                {totals.referralDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Diskon Referral:</span>
                    <span>-{formatCurrency(totals.referralDiscount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Setelah Diskon:</span>
                  <span>{formatCurrency(totals.discountedSubtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>PPN (11%):</span>
                  <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={generateInvoiceMutation.isPending || !selectedSubscriptionId}
                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              >
                {generateInvoiceMutation.isPending ? "Membuat..." : "Buat Invoice"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}