import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2,
  Package,
  Download,
  ShoppingCart,
  ArrowLeft,
  Calendar,
  CreditCard,
  Mail,
  BookOpen,
  Home,
  Share2,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrderConfirmationData {
  id: number;
  user_id: number;
  total_amount_minor: number;
  currency_code: string;
  status: string;
  created_at: string;
  items: Array<{
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
  }>;
  customer_info?: {
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
  };
  shipping_address?: {
    full_name: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    country: string;
  };
}

export default function StudentOrderConfirmation() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { toast } = useToast();
  const params = useParams();
  const orderId = params.orderId;

  // Fetch order details
  const { data: orderResponse, isLoading, error } = useQuery<{success: boolean; data: OrderConfirmationData}>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId && !!user
  });

  const order = orderResponse?.data;

  // Share order
  const shareOrder = async () => {
    if (navigator.share && order) {
      try {
        await navigator.share({
          title: t('student:orderConfirmation.shareTitle'),
          text: t('student:orderConfirmation.shareText', { orderId: order.id }),
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: t('student:orderConfirmation.linkCopied'),
          description: t('student:orderConfirmation.linkCopiedDescription'),
          variant: "default"
        });
      }
    } else if (order) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('student:orderConfirmation.linkCopied'),
        description: t('student:orderConfirmation.linkCopiedDescription'),
        variant: "default"
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="confirmation-loading">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600 dark:text-gray-400">{t('student:orderConfirmation.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="confirmation-error">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('student:orderConfirmation.errorTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('student:orderConfirmation.errorMessage')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/student/order-history">
                <Button variant="outline" data-testid="button-view-orders">
                  <Package className="w-4 h-4 mr-2" />
                  {t('student:orderConfirmation.viewOrders')}
                </Button>
              </Link>
              <Link href="/student/virtual-mall">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {t('student:orderConfirmation.continueShopping')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('student:orderConfirmation.backToDashboard')}
                </Button>
              </Link>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={shareOrder} data-testid="button-share-order">
                <Share2 className="w-4 h-4 mr-2" />
                {t('student:orderConfirmation.share')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="confirmation-title">
            {t('student:orderConfirmation.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400" data-testid="confirmation-subtitle">
            {t('student:orderConfirmation.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="order-summary-title">
                    <Package className="w-5 h-5 text-green-600" />
                    {t('student:orderConfirmation.orderSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('student:orderConfirmation.orderNumber')}
                      </Label>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid="order-number">
                        #{order.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('student:orderConfirmation.orderDate')}
                      </Label>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid="order-date">
                        {format(new Date(order.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('student:orderConfirmation.orderStatus')}
                      </Label>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" data-testid="order-status">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('student:orderConfirmation.confirmed')}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="mb-6" />

                  {/* Order Items */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {t('student:orderConfirmation.orderItems')}
                    </h3>
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600" data-testid={`confirmation-item-${item.id}`}>
                        <div className="w-16 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`item-title-${item.id}`}>
                            {item.book.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t('student:orderConfirmation.byAuthor', {author: item.book.author})}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {t('student:orderConfirmation.quantity', {quantity: item.quantity})}
                            </span>
                            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100" data-testid={`item-total-${item.id}`}>
                              ${((item.price_minor * item.quantity) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Customer Information */}
            {order.customer_info && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      {t('student:orderConfirmation.customerInformation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('student:orderConfirmation.customerName')}
                        </Label>
                        <p className="text-gray-900 dark:text-gray-100" data-testid="customer-name">
                          {order.customer_info.first_name} {order.customer_info.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('student:orderConfirmation.email')}
                        </Label>
                        <p className="text-gray-900 dark:text-gray-100" data-testid="customer-email">
                          {order.customer_info.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {t('student:orderConfirmation.phone')}
                        </Label>
                        <p className="text-gray-900 dark:text-gray-100" data-testid="customer-phone">
                          {order.customer_info.phone}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Shipping Address */}
            {order.shipping_address && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-purple-600" />
                      {t('student:orderConfirmation.shippingAddress')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-900 dark:text-gray-100" data-testid="shipping-address">
                      <p className="font-medium">{order.shipping_address.full_name}</p>
                      <p>{order.shipping_address.address_line1}</p>
                      {order.shipping_address.address_line2 && (
                        <p>{order.shipping_address.address_line2}</p>
                      )}
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                      </p>
                      <p>{order.shipping_address.country}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Order Total & Actions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="order-total-title">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    {t('student:orderConfirmation.orderTotal')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('student:orderConfirmation.subtotal')}</span>
                      <span className="font-medium" data-testid="confirmation-subtotal">
                        ${(order.total_amount_minor / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('student:orderConfirmation.shipping')}</span>
                      <span className="font-medium text-green-600">{t('common:free')}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{t('student:orderConfirmation.tax')}</span>
                      <span className="font-medium">$0.00</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>{t('student:orderConfirmation.total')}</span>
                      <span className="text-green-600 dark:text-green-400" data-testid="confirmation-grand-total">
                        ${(order.total_amount_minor / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                      data-testid="button-download-receipt"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('student:orderConfirmation.downloadReceipt')}
                    </Button>

                    <Link href="/student/order-history">
                      <Button variant="outline" className="w-full" data-testid="button-view-all-orders">
                        <Package className="w-4 h-4 mr-2" />
                        {t('student:orderConfirmation.viewAllOrders')}
                      </Button>
                    </Link>

                    <Link href="/student/virtual-mall">
                      <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {t('student:orderConfirmation.continueShopping')}
                      </Button>
                    </Link>

                    <Link href="/student/dashboard">
                      <Button variant="ghost" className="w-full" data-testid="button-back-to-dashboard">
                        <Home className="w-4 h-4 mr-2" />
                        {t('student:orderConfirmation.backToDashboard')}
                      </Button>
                    </Link>
                  </div>

                  {/* Delivery Estimate */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('student:orderConfirmation.estimatedDelivery')}</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      {t('student:orderConfirmation.deliveryTime')}
                    </p>
                  </div>

                  {/* Email Confirmation Note */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('student:orderConfirmation.emailSent')}</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      {t('student:orderConfirmation.emailNote', { email: order.customer_info?.email })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for labels
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`block text-sm font-medium ${className}`}>{children}</span>
);