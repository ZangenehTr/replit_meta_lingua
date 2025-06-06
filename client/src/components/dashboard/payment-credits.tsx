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
import { CreditCard, Plus, Shield, Banknote, CheckCircle, XCircle, Clock, Star } from "lucide-react";
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

const CREDIT_PACKAGES = [
  { 
    amount: 25000, 
    credits: 10, 
    title: "Starter Package", 
    description: "Perfect for beginners",
    pricePerCredit: 2500
  },
  { 
    amount: 50000, 
    credits: 25, 
    title: "Popular Package", 
    description: "Most popular choice", 
    popular: true,
    pricePerCredit: 2000
  },
  { 
    amount: 100000, 
    credits: 55, 
    title: "Premium Package", 
    description: "Best value for money",
    pricePerCredit: 1818
  },
  { 
    amount: 200000, 
    credits: 120, 
    title: "Professional Package", 
    description: "For serious learners",
    pricePerCredit: 1667
  },
];

export function PaymentCredits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const buyCreditseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/shetab/initiate", {
        amount: 50000, // 50,000 IRR
        creditsPurchase: 20
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Shetab payment gateway
      window.location.href = data.paymentUrl;
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Unable to initiate payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const lastPayment = payments?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credits & Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-primary mb-2">
            {user?.credits || 0}
          </div>
          <p className="text-muted-foreground">Credits Available</p>
        </div>
        
        <Button 
          className="w-full mb-4"
          onClick={() => buyCreditseMutation.mutate()}
          disabled={buyCreditseMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          {buyCreditseMutation.isPending ? "Processing..." : "Buy More Credits"}
        </Button>
        
        {lastPayment && (
          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Purchase:</span>
              <span className="font-medium">{lastPayment.creditsAwarded} Credits</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{new Date(lastPayment.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>{parseInt(lastPayment.amount).toLocaleString()} IRR</span>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Secure payment via Shetab</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
