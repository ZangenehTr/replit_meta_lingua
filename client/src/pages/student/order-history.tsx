import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Package,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  BookOpen,
  ShoppingCart,
  Eye,
  RotateCcw,
  FileText,
  Loader2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EnhancedOrder, OrderFilters } from '@/types/ecommerce';

interface OrderItemWithBook {
  id: number;
  book: {
    id: number;
    title: string;
    author: string;
    price: number;
    cover_image?: string;
  };
  quantity: number;
  price_minor: number;
}

interface OrderWithItems {
  id: number;
  user_id: number;
  total_amount_minor: number;
  currency_code: string;
  status: string;
  created_at: string;
  items: OrderItemWithBook[];
}

export default function StudentOrderHistory() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { toast } = useToast();

  const [filters, setFilters] = useState<OrderFilters>({
    limit: 20,
    offset: 0
  });
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  // Fetch orders with filters
  const { data: ordersResponse, isLoading, error, refetch } = useQuery<{success: boolean; data: OrderWithItems[]; total: number}>({
    queryKey: ['/api/orders', filters],
    enabled: !!user
  });

  const orders = ordersResponse?.data || [];
  const totalOrders = ordersResponse?.total || 0;

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest('/api/orders/reorder', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: t('student:orders.reordered'),
        description: t('student:orders.itemsAddedToCart'),
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('student:orders.reorderError'),
        variant: "destructive"
      });
    }
  });

  // Download receipt mutation
  const downloadReceiptMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/orders/${orderId}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to download receipt');
      return response.blob();
    },
    onSuccess: (blob, orderId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `order-${orderId}-receipt.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t('student:orders.downloaded'),
        description: t('student:orders.receiptDownloaded'),
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:orders.downloadError'),
        variant: "destructive"
      });
    }
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'refunded': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': 
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': 
      case 'refunded': return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const canReorder = (order: OrderWithItems) => {
    return ['completed', 'delivered'].includes(order.status);
  };

  const canDownload = (order: OrderWithItems) => {
    return ['completed', 'delivered'].includes(order.status);
  };

  // Filter handlers
  const handleFilterChange = (key: keyof OrderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({ limit: 20, offset: 0 });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="orders-loading">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-400">{t('student:orders.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="orders-error">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('student:orders.errorTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('student:orders.errorMessage')}
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry-orders">
              {t('student:orders.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                  <Package className="w-4 h-4 mr-2" />
                  {t('student:orders.backToDashboard')}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title-orders">
                    {t('student:orders.title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('student:orders.subtitle', { count: totalOrders })}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/student/virtual-mall">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" data-testid="button-shop-more">
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('student:orders.shopMore')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Filters */}
        <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="filters-title">
              <Filter className="w-5 h-5 text-indigo-600" />
              {t('student:orders.filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">{t('student:orders.search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={t('student:orders.searchPlaceholder')}
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">{t('student:orders.status')}</Label>
                <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder={t('student:orders.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('student:orders.allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('student:orders.pending')}</SelectItem>
                    <SelectItem value="processing">{t('student:orders.processing')}</SelectItem>
                    <SelectItem value="shipped">{t('student:orders.shipped')}</SelectItem>
                    <SelectItem value="delivered">{t('student:orders.delivered')}</SelectItem>
                    <SelectItem value="completed">{t('student:orders.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('student:orders.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date_from">{t('student:orders.dateFrom')}</Label>
                <Input
                  id="date_from"
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  data-testid="input-date-from"
                />
              </div>

              <div>
                <Label htmlFor="date_to">{t('student:orders.dateTo')}</Label>
                <Input
                  id="date_to"
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('student:orders.clearFilters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            data-testid="orders-empty"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('student:orders.emptyTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('student:orders.emptyMessage')}
            </p>
            <Link href="/student/virtual-mall">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" data-testid="button-start-shopping">
                <BookOpen className="w-4 h-4 mr-2" />
                {t('student:orders.startShopping')}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                data-testid={`order-card-${order.id}`}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid={`order-number-${order.id}`}>
                            {t('student:orders.orderNumber', { number: order.id })}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`order-date-${order.id}`}>
                              {format(new Date(order.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(order.status)}`} data-testid={`order-status-${order.id}`}>
                          {getStatusIcon(order.status)}
                          {t(`student:orders.${order.status}`)}
                        </Badge>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid={`order-total-${order.id}`}>
                          ${(order.total_amount_minor / 100).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          data-testid={`button-toggle-order-${order.id}`}
                        >
                          {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {t('student:orders.itemsCount', { count: order.items.length })}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{order.items[0]?.book.title}</span>
                      {order.items.length > 1 && (
                        <span>
                          {t('student:orders.andMore', { count: order.items.length - 1 })}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)} data-testid={`button-view-details-${order.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            {t('student:orders.viewDetails')}
                          </Button>
                        </DialogTrigger>
                      </Dialog>

                      {canReorder(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reorderMutation.mutate(order.id)}
                          disabled={reorderMutation.isPending}
                          data-testid={`button-reorder-${order.id}`}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {t('student:orders.reorder')}
                        </Button>
                      )}

                      {canDownload(order) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReceiptMutation.mutate(order.id)}
                          disabled={downloadReceiptMutation.isPending}
                          data-testid={`button-download-receipt-${order.id}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('student:orders.downloadReceipt')}
                        </Button>
                      )}
                    </div>

                    {/* Expanded Order Details */}
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <Separator className="my-4" />
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {t('student:orders.orderItems')}
                            </h4>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg" data-testid={`order-item-${item.id}`}>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100" data-testid={`item-title-${item.id}`}>
                                      {item.book.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {t('student:orders.byAuthor', { author: item.book.author })}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {t('student:orders.quantity', { quantity: item.quantity })}
                                    </p>
                                  </div>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`item-price-${item.id}`}>
                                  ${(item.price_minor / 100).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="order-details-modal">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {t('student:orders.orderDetails')} #{selectedOrder.id}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('student:orders.orderDate')}</Label>
                    <p className="text-sm font-medium" data-testid="modal-order-date">
                      {format(new Date(selectedOrder.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <Label>{t('student:orders.status')}</Label>
                    <Badge className={`flex items-center gap-1 w-fit ${getStatusColor(selectedOrder.status)}`} data-testid="modal-order-status">
                      {getStatusIcon(selectedOrder.status)}
                      {t(`student:orders.${selectedOrder.status}`)}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-3">{t('student:orders.orderItems')}</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg" data-testid={`modal-item-${item.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {item.book.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('student:orders.byAuthor', { author: item.book.author })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('student:orders.quantityWithPrice', { 
                                quantity: item.quantity, 
                                price: (item.price_minor / 100).toFixed(2) 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                            ${((item.price_minor * item.quantity) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Total */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:orders.subtotal')}</span>
                    <span className="font-medium" data-testid="modal-subtotal">
                      ${(selectedOrder.total_amount_minor / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:orders.shipping')}</span>
                    <span className="font-medium text-green-600">{t('common:free')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:orders.tax')}</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('student:orders.total')}</span>
                    <span className="text-indigo-600 dark:text-indigo-400" data-testid="modal-grand-total">
                      ${(selectedOrder.total_amount_minor / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {canReorder(selectedOrder) && (
                    <Button
                      onClick={() => {
                        reorderMutation.mutate(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      disabled={reorderMutation.isPending}
                      className="flex-1"
                      data-testid="modal-button-reorder"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t('student:orders.reorder')}
                    </Button>
                  )}

                  {canDownload(selectedOrder) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        downloadReceiptMutation.mutate(selectedOrder.id);
                        setSelectedOrder(null);
                      }}
                      disabled={downloadReceiptMutation.isPending}
                      className="flex-1"
                      data-testid="modal-button-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('student:orders.downloadReceipt')}
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}