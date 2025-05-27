import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CreditCard, Plus } from "lucide-react";

interface Payment {
  id: number;
  amount: string;
  creditsAwarded: number;
  createdAt: string;
  status: string;
}

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
