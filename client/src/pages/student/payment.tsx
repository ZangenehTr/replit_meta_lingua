import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  History,
  ChevronRight,
  Filter,
  Calendar,
  Package,
  ShoppingCart,
  Receipt,
  CircleDollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Download,
  Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: number;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  referenceNumber?: string;
  method?: string;
}

interface PaymentMethod {
  id: number;
  type: 'card' | 'wallet' | 'bank';
  last4?: string;
  bankName?: string;
  isDefault: boolean;
}

interface SessionPackage {
  id: number;
  name: string;
  sessions: number;
  price: number;
  discount?: number;
  validityDays: number;
  description: string;
  popular?: boolean;
}

export default function StudentPayment() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'wallet' | 'packages' | 'history'>('wallet');
  const [selectedPackage, setSelectedPackage] = useState<SessionPackage | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  // Fetch wallet info
  const { data: walletInfo } = useQuery({
    queryKey: ['/api/student/wallet'],
    queryFn: async () => {
      const response = await fetch('/api/student/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return { balance: 0, memberTier: 'Bronze', totalSpent: 0 };
      }
      return response.json();
    }
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/student/transactions'],
    queryFn: async () => {
      const response = await fetch('/api/student/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch session packages
  const { data: packages = [] } = useQuery<SessionPackage[]>({
    queryKey: ['/api/student/packages'],
    queryFn: async () => {
      const response = await fetch('/api/student/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Top up wallet mutation
  const topUpWalletMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/student/wallet/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to top up wallet');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:topUpSuccess', 'Top Up Successful'),
        description: t('student:walletUpdated', 'Your wallet has been updated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/transactions'] });
      setShowTopUpModal(false);
      setTopUpAmount('');
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:topUpError', 'Failed to top up wallet'),
        variant: 'destructive'
      });
    }
  });

  // Purchase package mutation
  const purchasePackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await fetch(`/api/student/packages/${packageId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to purchase package');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:purchaseSuccess', 'Purchase Successful'),
        description: t('student:packageActivated', 'Your package has been activated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/transactions'] });
      setSelectedPackage(null);
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:purchaseError', 'Failed to purchase package'),
        variant: 'destructive'
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'debit': return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'refund': return <CircleDollarSign className="w-5 h-5 text-blue-400" />;
      default: return <Receipt className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Header */}
        <motion.header 
          className="mobile-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-bold text-xl">{t('student:payment', 'Payment')}</h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white text-sm font-medium flex items-center gap-2"
              onClick={() => setShowTopUpModal(true)}
            >
              <Plus className="w-4 h-4" />
              {t('student:topUp', 'Top Up')}
            </motion.button>
          </div>

          {/* Wallet Balance Card */}
          <motion.div 
            className="glass-card p-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">{t('student:walletBalance', 'Wallet Balance')}</p>
                  <p className="text-white text-2xl font-bold">
                    {formatCurrency(walletInfo?.balance || 0)}
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                {walletInfo?.memberTier || 'Bronze'}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-white/20">
              <span className="text-white/60 text-sm">{t('student:totalSpent', 'Total Spent')}</span>
              <span className="text-white font-medium">
                {formatCurrency(walletInfo?.totalSpent || 0)}
              </span>
            </div>
          </motion.div>

          {/* Tab Selector */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'wallet', label: t('student:wallet', 'Wallet'), icon: Wallet },
              { id: 'packages', label: t('student:packages', 'Packages'), icon: Package },
              { id: 'history', label: t('student:history', 'History'), icon: History }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedTab === tab.id 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/10 text-white/70 backdrop-blur'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="mobile-content">
          {/* Wallet Tab */}
          {selectedTab === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-20"
            >
              {/* Quick Top Up Options */}
              <div>
                <h2 className="text-white/90 font-semibold mb-3">{t('student:quickTopUp', 'Quick Top Up')}</h2>
                <div className="grid grid-cols-3 gap-3">
                  {[100000, 500000, 1000000].map((amount) => (
                    <motion.button
                      key={amount}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setTopUpAmount(amount.toString());
                        setShowTopUpModal(true);
                      }}
                      className="glass-card p-3 text-center"
                    >
                      <CreditCard className="w-6 h-6 text-white/70 mx-auto mb-2" />
                      <p className="text-white font-medium text-sm">
                        {formatCurrency(amount)}
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-white/90 font-semibold">{t('student:recentTransactions', 'Recent Transactions')}</h2>
                  <button
                    onClick={() => setSelectedTab('history')}
                    className="text-white/60 text-sm flex items-center gap-1"
                  >
                    {t('common:viewAll', 'View All')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      className="glass-card p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="text-white font-medium text-sm">
                              {transaction.description}
                            </p>
                            <p className="text-white/50 text-xs">
                              {formatDate(transaction.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'credit' ? 'text-green-400' : 
                            transaction.type === 'debit' ? 'text-red-400' : 'text-blue-400'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <Badge className={`text-xs ${
                            transaction.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                            transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Packages Tab */}
          {selectedTab === 'packages' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-20"
            >
              <h2 className="text-white/90 font-semibold">{t('student:sessionPackages', 'Session Packages')}</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    className={`glass-card p-4 cursor-pointer ${pkg.popular ? 'ring-2 ring-yellow-400' : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.popular && (
                      <Badge className="bg-yellow-400 text-black text-xs mb-2">
                        {t('student:mostPopular', 'Most Popular')}
                      </Badge>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{pkg.name}</h3>
                        <p className="text-white/60 text-sm">{pkg.description}</p>
                      </div>
                      <ShoppingCart className="w-5 h-5 text-white/50" />
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-white text-2xl font-bold">
                        {formatCurrency(pkg.price)}
                      </span>
                      {pkg.discount && (
                        <span className="text-white/50 line-through text-sm">
                          {formatCurrency(pkg.price * (1 + pkg.discount / 100))}
                        </span>
                      )}
                      {pkg.discount && (
                        <Badge className="bg-red-500/20 text-red-300 text-xs">
                          {pkg.discount}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-white/70 text-sm">
                      <span>{pkg.sessions} {t('student:sessions', 'Sessions')}</span>
                      <span>{pkg.validityDays} {t('student:days', 'Days')} {t('student:validity', 'Validity')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* History Tab */}
          {selectedTab === 'history' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-20"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-white/90 font-semibold">{t('student:transactionHistory', 'Transaction History')}</h2>
                <button className="text-white/60">
                  <Filter className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {transactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className="glass-card p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {transaction.description}
                          </p>
                          <p className="text-white/50 text-xs mt-1">
                            {formatDate(transaction.timestamp)}
                          </p>
                          {transaction.referenceNumber && (
                            <p className="text-white/40 text-xs mt-1">
                              Ref: {transaction.referenceNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'credit' ? 'text-green-400' : 
                          transaction.type === 'debit' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge className={`text-xs mt-1 ${
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          transaction.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTopUpModal(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('student:topUpWallet', 'Top Up Wallet')}</h2>
                <button
                  onClick={() => setShowTopUpModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">
                    {t('student:amount', 'Amount')}
                  </label>
                  <Input
                    type="number"
                    placeholder={t('student:enterAmount', 'Enter amount')}
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[100000, 500000, 1000000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopUpAmount(amount.toString())}
                      className="py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => topUpWalletMutation.mutate(Number(topUpAmount))}
                  disabled={!topUpAmount || topUpWalletMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {topUpWalletMutation.isPending 
                    ? t('student:processing', 'Processing...') 
                    : t('student:confirmTopUp', 'Confirm Top Up')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Purchase Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPackage(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{t('student:confirmPurchase', 'Confirm Purchase')}</h2>
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">{selectedPackage.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedPackage.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('student:sessions', 'Sessions')}</span>
                      <span className="font-medium">{selectedPackage.sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('student:validity', 'Validity')}</span>
                      <span className="font-medium">{selectedPackage.validityDays} {t('student:days', 'Days')}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                      <span>{t('student:total', 'Total')}</span>
                      <span className="text-purple-600">{formatCurrency(selectedPackage.price)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Wallet className="w-5 h-5" />
                    <span className="text-sm">
                      {t('student:currentBalance', 'Current Balance')}: {formatCurrency(walletInfo?.balance || 0)}
                    </span>
                  </div>
                  {(walletInfo?.balance || 0) < selectedPackage.price && (
                    <p className="text-red-600 text-xs mt-2">
                      {t('student:insufficientBalance', 'Insufficient balance. Please top up your wallet.')}
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => purchasePackageMutation.mutate(selectedPackage.id)}
                  disabled={purchasePackageMutation.isPending || (walletInfo?.balance || 0) < selectedPackage.price}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {purchasePackageMutation.isPending 
                    ? t('student:processing', 'Processing...') 
                    : t('student:confirmPurchase', 'Confirm Purchase')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}