import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Gift,
  TrendingUp,
  DollarSign,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'bonus';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  referenceId?: string;
}

interface WalletInfo {
  balance: number;
  memberTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  totalSpent: number;
  totalEarned: number;
  pendingAmount: number;
  lastTransactionDate?: string;
}

export default function StudentPaymentMobile() {
  const { t } = useTranslation();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [amount, setAmount] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Fetch wallet info
  const { data: wallet, isLoading: loadingWallet } = useQuery<WalletInfo>({
    queryKey: ['/api/student/wallet'],
    queryFn: async () => {
      const response = await fetch('/api/student/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch wallet');
      return response.json();
    }
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/student/transactions', filterType],
    queryFn: async () => {
      const response = await fetch(`/api/student/transactions?filter=${filterType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  // Add funds mutation
  const addFunds = useMutation({
    mutationFn: async (amount: number) => {
      const response = await fetch('/api/student/wallet/add-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to add funds');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
      toast({
        title: t('student:fundsAdded'),
        description: t('student:fundsAddedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/wallet'] });
      setShowAddFunds(false);
      setAmount('');
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:fundsAddError'),
        variant: 'destructive'
      });
    }
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'from-orange-600 to-orange-400';
      case 'Silver': return 'from-gray-500 to-gray-300';
      case 'Gold': return 'from-yellow-500 to-yellow-300';
      case 'Platinum': return 'from-purple-600 to-purple-400';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
      case 'withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-400" />;
      case 'purchase': return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'refund': return <RefreshCw className="w-5 h-5 text-purple-400" />;
      case 'bonus': return <Gift className="w-5 h-5 text-yellow-400" />;
      default: return <DollarSign className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickAmounts = [50000, 100000, 200000, 500000];

  return (
    <MobileLayout
      title={t('student:payment')}
      showBack={false}
      gradient="sunset"
    >
      {/* Wallet Card */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br ${getTierColor(wallet?.memberTier || 'Bronze')}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/70 text-sm mb-1">{t('student:walletBalance')}</p>
              <h2 className="text-white text-3xl font-bold">
                {formatAmount(wallet?.balance || 0)}
              </h2>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {wallet?.memberTier || 'Bronze'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-white/60 text-xs">{t('student:totalSpent')}</p>
              <p className="text-white font-semibold">
                {formatAmount(wallet?.totalSpent || 0)}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t('student:pendingAmount')}</p>
              <p className="text-white font-semibold">
                {formatAmount(wallet?.pendingAmount || 0)}
              </p>
            </div>
          </div>

          <motion.button
            className="w-full mt-6 py-3 bg-white/20 backdrop-blur rounded-xl text-white font-medium flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddFunds(true)}
          >
            <Plus className="w-5 h-5" />
            {t('student:addFunds')}
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <button className="glass-card p-4 text-center tap-scale">
          <CreditCard className="w-6 h-6 text-white mx-auto mb-2" />
          <p className="text-white/80 text-xs">{t('student:buyPackage')}</p>
        </button>
        <button className="glass-card p-4 text-center tap-scale">
          <Gift className="w-6 h-6 text-white mx-auto mb-2" />
          <p className="text-white/80 text-xs">{t('student:referral')}</p>
        </button>
        <button className="glass-card p-4 text-center tap-scale">
          <TrendingUp className="w-6 h-6 text-white mx-auto mb-2" />
          <p className="text-white/80 text-xs">{t('student:upgrade')}</p>
        </button>
      </motion.div>

      {/* Transaction Filter */}
      <motion.div 
        className="flex gap-2 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {['all', 'income', 'expense'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`
              flex-1 py-2 px-4 rounded-xl transition-all duration-200
              ${filterType === type 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:transactions.${type}`)}
          </button>
        ))}
      </motion.div>

      {/* Transactions List */}
      <div className="space-y-3">
        <h3 className="text-white font-semibold mb-3">{t('student:recentTransactions')}</h3>
        {loadingTransactions ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <MobileCard className="text-center py-8">
            <Wallet className="w-12 h-12 text-white/50 mx-auto mb-3" />
            <p className="text-white/70">{t('student:noTransactions')}</p>
          </MobileCard>
        ) : (
          transactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <MobileCard className="flex items-center gap-3">
                {/* Icon */}
                <div className="p-2 rounded-full bg-white/10">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm">
                    {transaction.description}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(transaction.status)}
                    <span className="text-white/50 text-xs">
                      {formatDate(transaction.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'bonus'
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'bonus' ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </p>
                </div>
              </MobileCard>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showAddFunds && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddFunds(false)}
          >
            <motion.div
              className="w-full bg-gradient-to-b from-purple-900/90 to-pink-900/90 rounded-t-3xl p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
              
              <h2 className="text-white text-xl font-bold mb-4">
                {t('student:addFunds')}
              </h2>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {quickAmounts.map((quickAmount) => (
                  <button
                    key={quickAmount}
                    className="glass-card p-3 text-center"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    <span className="text-white font-semibold">
                      {formatAmount(quickAmount)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="text-white/70 text-sm mb-2 block">
                  {t('student:customAmount')}
                </label>
                <input
                  type="number"
                  className="w-full p-3 bg-white/10 rounded-xl text-white placeholder-white/50 outline-none"
                  placeholder={t('student:enterAmount')}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddFunds(false)}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => amount && addFunds.mutate(Number(amount))}
                  disabled={!amount || Number(amount) <= 0}
                >
                  {t('student:proceedToPayment')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}