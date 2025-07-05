import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Gift, Star, Crown, Shield, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface WalletTransaction {
  id: number;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  description: string;
  transactionDate: Date;
  status: string;
  paymentMethod?: string;
  reference?: string;
}

interface MembershipTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  benefits: string[];
  discount: number;
  icon: any;
  color: string;
  isPopular?: boolean;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("shetab");

  const { data: walletBalance } = useQuery({
    queryKey: ['/api/students/wallet/balance'],
    enabled: !!user
  });

  const { data: transactions } = useQuery({
    queryKey: ['/api/students/wallet/transactions'],
    enabled: !!user
  });

  const { data: membershipInfo } = useQuery({
    queryKey: ['/api/students/membership'],
    enabled: !!user
  });

  const topupMutation = useMutation({
    mutationFn: async ({ amount, paymentMethod }: { amount: number; paymentMethod: string }) => {
      const response = await fetch('/api/students/wallet/topup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, paymentMethod })
      });
      
      if (!response.ok) throw new Error('Topup failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/wallet/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/wallet/transactions'] });
      setTopupAmount("");
    }
  });

  const upgradeMembershipMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const response = await fetch('/api/students/membership/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tierId })
      });
      
      if (!response.ok) throw new Error('Membership upgrade failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/membership'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/wallet/balance'] });
    }
  });

  const membershipTiers: MembershipTier[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      description: 'Perfect for beginners',
      price: 50000,
      currency: 'IRR',
      benefits: [
        'Access to basic courses',
        'Community forum access',
        'Mobile app access',
        '5% session discount'
      ],
      discount: 5,
      icon: Shield,
      color: 'text-amber-600'
    },
    {
      id: 'silver',
      name: 'Silver',
      description: 'Most popular choice',
      price: 120000,
      currency: 'IRR',
      benefits: [
        'All Bronze benefits',
        'Priority tutor booking',
        'Unlimited practice sessions',
        '10% session discount',
        'Monthly progress reports'
      ],
      discount: 10,
      icon: Star,
      color: 'text-gray-500',
      isPopular: true
    },
    {
      id: 'gold',
      name: 'Gold',
      description: 'Advanced learners',
      price: 200000,
      currency: 'IRR',
      benefits: [
        'All Silver benefits',
        'Personal learning coach',
        'Advanced analytics',
        '15% session discount',
        'Certificate programs',
        'Early access to new features'
      ],
      discount: 15,
      icon: Crown,
      color: 'text-yellow-500'
    },
    {
      id: 'diamond',
      name: 'Diamond',
      description: 'Ultimate experience',
      price: 350000,
      currency: 'IRR',
      benefits: [
        'All Gold benefits',
        'One-on-one mentorship',
        'Custom curriculum',
        '25% session discount',
        'VIP support',
        'Exclusive events access',
        'Cultural immersion programs'
      ],
      discount: 25,
      icon: Trophy,
      color: 'text-blue-500'
    }
  ];

  const handleTopup = () => {
    const amount = parseInt(topupAmount);
    if (amount && amount > 0) {
      topupMutation.mutate({ amount, paymentMethod: selectedPaymentMethod });
    }
  };

  const quickTopupAmounts = [50000, 100000, 200000, 500000];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Wallet & Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your wallet balance and membership benefits
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Balance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {walletBalance?.balance?.toLocaleString() || '0'} IRR
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Available Credits</p>
                </div>

                {/* Quick Topup */}
                <div>
                  <h3 className="font-semibold mb-4">Add Credits</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {quickTopupAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setTopupAmount(amount.toString())}
                        className="h-12"
                      >
                        {amount.toLocaleString()} IRR
                      </Button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Custom amount"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(e.target.value)}
                      type="number"
                    />
                    <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shetab">Shetab</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleTopup}
                      disabled={!topupAmount || topupMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Credits
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Membership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Membership
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {membershipInfo?.currentTier || 'Free'}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Current Plan
                  </p>
                  {membershipInfo?.discount && (
                    <Badge variant="secondary" className="mt-2">
                      {membershipInfo.discount}% Discount
                    </Badge>
                  )}
                </div>

                {membershipInfo?.currentTier !== 'diamond' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Choose Your Membership Plan</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {membershipTiers.map((tier) => {
                          const IconComponent = tier.icon;
                          return (
                            <Card 
                              key={tier.id} 
                              className={`relative ${tier.isPopular ? 'border-primary ring-2 ring-primary/20' : ''}`}
                            >
                              {tier.isPopular && (
                                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                  Most Popular
                                </Badge>
                              )}
                              <CardHeader>
                                <div className="flex items-center gap-2">
                                  <IconComponent className={`h-6 w-6 ${tier.color}`} />
                                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {tier.description}
                                </p>
                                <div className="text-2xl font-bold">
                                  {tier.price.toLocaleString()} IRR
                                  <span className="text-sm font-normal text-gray-500">/month</span>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2 mb-4">
                                  {tier.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                                <Button 
                                  className="w-full"
                                  onClick={() => upgradeMembershipMutation.mutate(tier.id)}
                                  disabled={upgradeMembershipMutation.isPending}
                                  variant={tier.isPopular ? 'default' : 'outline'}
                                >
                                  {upgradeMembershipMutation.isPending ? 'Processing...' : 'Choose Plan'}
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {membershipInfo?.nextBillingDate && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Next billing: {format(new Date(membershipInfo.nextBillingDate), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Transactions</TabsTrigger>
                <TabsTrigger value="topups">Top-ups</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-2">
                  {transactions && transactions.length > 0 ? (
                    transactions.map((transaction: WalletTransaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'credit' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {format(new Date(transaction.transactionDate), 'MMM d, yyyy • h:mm a')}
                            </p>
                            {transaction.paymentMethod && (
                              <p className="text-xs text-gray-500">
                                via {transaction.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}
                            {transaction.amount.toLocaleString()} {transaction.currency}
                          </p>
                          <Badge variant={
                            transaction.status === 'completed' ? 'outline' : 
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No transactions yet</p>
                      <p className="text-sm text-gray-400">
                        Your transaction history will appear here
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="topups">
                <div className="text-center py-8">
                  <p className="text-gray-500">Top-up transactions will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="payments">
                <div className="text-center py-8">
                  <p className="text-gray-500">Payment transactions will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="refunds">
                <div className="text-center py-8">
                  <p className="text-gray-500">Refund transactions will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Referral Program */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Refer Friends & Earn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">Invite friends and earn 10,000 IRR credits</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Both you and your friend get credits when they complete their first session
                </p>
              </div>
              <Button onClick={() => window.location.href = '/referrals'}>
                Share Referral Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}