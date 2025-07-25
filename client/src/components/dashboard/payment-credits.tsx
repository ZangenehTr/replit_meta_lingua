import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { CreditCard, Plus, Shield, Banknote, CheckCircle, XCircle, Clock, Star, Coins } from "lucide-react";
import { useState } from "react";

interface Payment {
  id: number;
  amount: string;
  creditsAwarded: number;
  createdAt: string;
  status: string;
  provider: string;
  merchantTransactionId?: string;
  referenceNumber?: string;
  cardNumber?: string;
}

// Fetch credit packages from API instead of hardcoding

export function PaymentCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [customCredits, setCustomCredits] = useState("");
  const [paymentMode, setPaymentMode] = useState<"package" | "custom">("package");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Fetch credit packages from API
  const { data: CREDIT_PACKAGES = [] } = useQuery({
    queryKey: ["/api/admin/credit-packages"],
    select: (data: any[]) => data || []
  });

  const shetabPaymentMutation = useMutation({
    mutationFn: async (paymentData: { amount: number; creditsPurchase: number; description?: string }) => {
      const response = await apiRequest("/api/payments/shetab/initiate", {
        method: "POST", 
        body: JSON.stringify(paymentData)
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        toast({
          title: "Redirecting to Payment Gateway",
          description: "You will be redirected to Shetab payment gateway...",
        });
        // Redirect to Shetab payment gateway
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || "Payment initialization failed");
      }
    },
    onError: (error: any) => {
      // Handle payment error gracefully
      let errorMessage = "Unable to initiate payment. Please try again.";
      
      if (error.message?.includes("SHETAB_NOT_CONFIGURED")) {
        errorMessage = "Payment service is temporarily unavailable. Please contact support.";
      } else if (error.message?.includes("Invalid payment amount")) {
        errorMessage = "Please enter a valid payment amount.";
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handlePackagePayment = () => {
    shetabPaymentMutation.mutate({
      amount: selectedPackage.amount,
      creditsPurchase: selectedPackage.credits,
      description: `${selectedPackage.title} - ${selectedPackage.credits} Credits`
    });
  };

  const handleCustomPayment = () => {
    const amount = parseInt(customAmount);
    const credits = parseInt(customCredits);
    
    if (!amount || amount < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum payment amount is 1,000 IRR",
        variant: "destructive",
      });
      return;
    }
    
    if (!credits || credits < 1) {
      toast({
        title: "Invalid Credits",
        description: "Please specify the number of credits to purchase",
        variant: "destructive",
      });
      return;
    }

    shetabPaymentMutation.mutate({
      amount,
      creditsPurchase: credits,
      description: `Custom Credits Purchase - ${credits} Credits`
    });
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0,
    }).format(typeof amount === 'string' ? parseInt(amount) : amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const lastPayment = payments?.[0];

  return (
    <div className="space-y-6">
      {/* Current Credits Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credits & Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary mb-2">
              {user?.credits || 0}
            </div>
            <p className="text-muted-foreground">Credits Available</p>
          </div>
          
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4">
                <Plus className="mr-2 h-4 w-4" />
                Buy More Credits
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Purchase Credits</DialogTitle>
                <DialogDescription>
                  Choose a credit package or create a custom purchase
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Payment Mode Selector */}
                <div className="flex gap-4 p-1 bg-muted rounded-lg">
                  <Button
                    variant={paymentMode === "package" ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setPaymentMode("package")}
                  >
                    Credit Packages
                  </Button>
                  <Button
                    variant={paymentMode === "custom" ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setPaymentMode("custom")}
                  >
                    Custom Amount
                  </Button>
                </div>

                {paymentMode === "package" ? (
                  /* Credit Packages */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {CREDIT_PACKAGES.map((pkg, index) => (
                        <Card 
                          key={index}
                          className={`cursor-pointer transition-all border-2 ${
                            selectedPackage.amount === pkg.amount 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          } ${pkg.popular ? 'ring-2 ring-primary ring-opacity-50' : ''}`}
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{pkg.title}</h3>
                              {pkg.popular && (
                                <Badge variant="default" className="bg-primary">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">
                                {formatCurrency(pkg.amount)}
                              </div>
                              <div className="text-lg text-primary font-semibold">
                                {pkg.credits} Credits
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(pkg.pricePerCredit)} per credit
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handlePackagePayment}
                      disabled={shetabPaymentMutation.isPending}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {shetabPaymentMutation.isPending 
                        ? "Processing..." 
                        : `Pay ${formatCurrency(selectedPackage.amount)} for ${selectedPackage.credits} Credits`
                      }
                    </Button>
                  </div>
                ) : (
                  /* Custom Payment */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customAmount">Payment Amount (IRR)</Label>
                        <Input
                          id="customAmount"
                          type="number"
                          placeholder="Enter amount in IRR"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          min="1000"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum: 1,000 IRR
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="customCredits">Credits to Receive</Label>
                        <Input
                          id="customCredits"
                          type="number"
                          placeholder="Enter number of credits"
                          value={customCredits}
                          onChange={(e) => setCustomCredits(e.target.value)}
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {customAmount && customCredits 
                            ? `${formatCurrency(Math.round(parseInt(customAmount) / parseInt(customCredits)))} per credit`
                            : "Set amount and credits to see price per credit"
                          }
                        </p>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleCustomPayment}
                      disabled={shetabPaymentMutation.isPending || !customAmount || !customCredits}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {shetabPaymentMutation.isPending 
                        ? "Processing..." 
                        : customAmount && customCredits
                          ? `Pay ${formatCurrency(parseInt(customAmount))} for ${customCredits} Credits`
                          : "Enter Amount and Credits"
                      }
                    </Button>
                  </div>
                )}

                {/* Security Notice */}
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    Secure payment powered by Shetab payment gateway
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Secure payment via Shetab
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading payments...</p>
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <div className="font-medium">
                        {payment.creditsAwarded} Credits
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString('fa-IR')}
                        {payment.merchantTransactionId && (
                          <span className="ml-2">• {payment.merchantTransactionId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(payment.status)}
                      {payment.cardNumber && (
                        <span className="text-xs text-muted-foreground">
                          {payment.cardNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {payments.length > 5 && (
                <div className="text-center">
                  <Button variant="ghost" size="sm">
                    View All Payments
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No payment history yet</p>
              <p className="text-sm text-muted-foreground">
                Purchase credits to see your transaction history
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
