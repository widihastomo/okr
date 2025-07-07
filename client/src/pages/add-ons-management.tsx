
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Minus, 
  Package, 
  DollarSign, 
  Users, 
  HardDrive,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddOn {
  id: string;
  name: string;
  slug: string;
  description: string;
  unitPrice: string;
  unitName: string;
  isActive: boolean;
  applicablePlans: string[];
}

interface AddOnSubscription {
  subscription: {
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    status: string;
  };
  addOn: AddOn;
}

const AddOnIcon = ({ slug }: { slug: string }) => {
  switch (slug) {
    case 'extra-user':
      return <Users className="w-5 h-5" />;
    case 'storage-10gb':
      return <HardDrive className="w-5 h-5" />;
    case 'api-calls-10k':
      return <Zap className="w-5 h-5" />;
    case 'priority-support':
      return <Shield className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
};

export default function AddOnsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);

  // Get current organization info
  const { data: orgInfo } = useQuery({
    queryKey: ["/api/my-organization"],
  });

  // Get available add-ons
  const { data: availableAddOns = [] } = useQuery<AddOn[]>({
    queryKey: ["/api/subscription-add-ons", orgInfo?.subscription?.plan?.slug],
    queryFn: async () => {
      const planSlug = orgInfo?.subscription?.plan?.slug;
      const url = planSlug ? `/api/subscription-add-ons?planSlug=${planSlug}` : "/api/subscription-add-ons";
      return apiRequest(url);
    },
    enabled: !!orgInfo,
  });

  // Get current add-on subscriptions
  const { data: currentAddOns = [], isLoading } = useQuery<AddOnSubscription[]>({
    queryKey: ["/api/organization/add-ons"],
  });

  // Subscribe to add-on mutation
  const subscribeMutation = useMutation({
    mutationFn: async ({ addOnId, quantity }: { addOnId: string; quantity: number }) => {
      return apiRequest("/api/organization/add-ons/subscribe", {
        method: "POST",
        body: JSON.stringify({ addOnId, quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/add-ons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/check-limits"] });
      toast({
        title: "Berhasil",
        description: "Add-on berhasil ditambahkan ke langganan Anda",
      });
      setIsSubscribeDialogOpen(false);
      setSelectedAddOn(null);
      setQuantity(1);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan add-on",
        variant: "destructive",
      });
    },
  });

  // Update add-on quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ subscriptionId, quantity }: { subscriptionId: string; quantity: number }) => {
      return apiRequest(`/api/organization/add-ons/${subscriptionId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization/add-ons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/check-limits"] });
      toast({
        title: "Berhasil",
        description: "Jumlah add-on berhasil diperbarui",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui add-on",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleSubscribe = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setQuantity(1);
    setIsSubscribeDialogOpen(true);
  };

  const handleUpdateQuantity = (subscriptionId: string, currentQuantity: number, change: number) => {
    const newQuantity = Math.max(0, currentQuantity + change);
    updateQuantityMutation.mutate({ subscriptionId, quantity: newQuantity });
  };

  const isSubscribed = (addOnId: string) => {
    return currentAddOns.some(sub => sub.addOn.id === addOnId && sub.subscription.status === "active");
  };

  const getSubscription = (addOnId: string) => {
    return currentAddOns.find(sub => sub.addOn.id === addOnId && sub.subscription.status === "active");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Memuat add-ons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add-Ons Management</h1>
        <p className="text-gray-600 mt-2">
          Tingkatkan langganan Anda dengan add-on tambahan sesuai kebutuhan
        </p>
      </div>

      {/* Current Add-ons */}
      {currentAddOns.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add-Ons Aktif</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentAddOns.map((addOnSub) => (
              <Card key={addOnSub.subscription.id} className="border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AddOnIcon slug={addOnSub.addOn.slug} />
                      <CardTitle className="text-lg">{addOnSub.addOn.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                  <CardDescription>{addOnSub.addOn.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Jumlah:</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(
                            addOnSub.subscription.id, 
                            addOnSub.subscription.quantity, 
                            -1
                          )}
                          disabled={updateQuantityMutation.isPending}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-medium w-8 text-center">
                          {addOnSub.subscription.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuantity(
                            addOnSub.subscription.id, 
                            addOnSub.subscription.quantity, 
                            1
                          )}
                          disabled={updateQuantityMutation.isPending}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total per bulan:</span>
                      <span className="font-semibold text-lg">
                        {formatPrice(addOnSub.subscription.totalPrice)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Add-ons */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Add-Ons Tersedia</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAddOns.map((addOn) => {
            const subscription = getSubscription(addOn.id);
            const subscribed = isSubscribed(addOn.id);

            return (
              <Card key={addOn.id} className={subscribed ? "border-gray-200 opacity-75" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AddOnIcon slug={addOn.slug} />
                      <CardTitle className="text-lg">{addOn.name}</CardTitle>
                    </div>
                    {subscribed && (
                      <Badge variant="secondary">
                        Sudah Berlangganan
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{addOn.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Harga per {addOn.unitName}:</span>
                      <span className="font-semibold">
                        {formatPrice(addOn.unitPrice)}/bulan
                      </span>
                    </div>
                    {!subscribed && (
                      <Button 
                        onClick={() => handleSubscribe(addOn)}
                        disabled={subscribeMutation.isPending}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambahkan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Subscribe Dialog */}
      <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambahkan {selectedAddOn?.name}</DialogTitle>
            <DialogDescription>
              {selectedAddOn?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Jumlah {selectedAddOn?.unitName}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            
            {selectedAddOn && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total per bulan:</span>
                  <span className="font-semibold text-lg">
                    {formatPrice((parseFloat(selectedAddOn.unitPrice) * quantity).toString())}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubscribeDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={() => {
                if (selectedAddOn) {
                  subscribeMutation.mutate({ addOnId: selectedAddOn.id, quantity });
                }
              }}
              disabled={subscribeMutation.isPending}
            >
              {subscribeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Tambahkan Add-On
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
