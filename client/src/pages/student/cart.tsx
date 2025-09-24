import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Package,
  CreditCard,
  Sparkles,
  BookOpen,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Book as CourseBook } from '@shared/schema';

interface CartItem {
  id: number;
  book: CourseBook;
  quantity: number;
  subtotal: number;
  added_at: string;
}

interface CartData {
  id: number;
  user_id: number;
  items: CartItem[];
  total_items: number;
  total_amount: number;
  updated_at: string;
}

export default function StudentCart() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { toast } = useToast();

  // Fetch cart data
  const { data: cartResponse, isLoading, error, refetch } = useQuery<{success: boolean; data: CartData}>({
    queryKey: ['/api/cart'],
    enabled: !!user
  });

  const cart = cartResponse?.data;

  // Update cart item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      return apiRequest(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: t('student:cart.updated'),
        description: t('student:cart.quantityUpdated'),
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:cart.updateError'),
        variant: "destructive"
      });
    }
  });

  // Remove cart item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest(`/api/cart/items/${itemId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: t('student:cart.removed'),
        description: t('student:cart.itemRemoved'),
        variant: "default"
      });
    },
    onError: () => {
      toast({
        title: t('common:error'), 
        description: t('student:cart.removeError'),
        variant: "destructive"
      });
    }
  });

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: number) => {
    removeItemMutation.mutate(itemId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="cart-loading">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('student:cart.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="cart-error">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t('student:cart.errorTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('student:cart.errorMessage')}
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry-cart">
              {t('student:cart.tryAgain')}
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
              <Link href="/student/virtual-mall">
                <Button variant="ghost" size="sm" data-testid="button-back-to-mall">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('student:cart.backToMall')}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title-cart">
                    {t('student:cart.title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {cart?.total_items || 0} item{cart?.total_items !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('student:cart.readyForCheckout')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {!cart || cart.items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            data-testid="cart-empty"
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('student:cart.emptyTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('student:cart.emptyMessage')}
            </p>
            <Link href="/student/virtual-mall">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" data-testid="button-browse-books">
                <BookOpen className="w-4 h-4 mr-2" />
                {t('student:cart.browseCourses')}
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2" data-testid="cart-items-title">
                      <Package className="w-5 h-5 text-indigo-600" />
                      {t('student:cart.yourItems', {count: cart.total_items})}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4" data-testid="cart-items-container">
                    {cart.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 hover:shadow-md transition-shadow"
                        data-testid={`cart-item-${item.id}`}
                      >
                        {/* Book Info */}
                        <div className="w-16 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`book-title-${item.id}`}>
                            {item.book.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2" data-testid={`book-author-${item.id}`}>
                            {t('student:cart.byAuthor', {author: item.book.author})}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            {item.book.is_free ? (
                              <Badge variant="secondary" className="text-xs" data-testid={`book-free-badge-${item.id}`}>
                                {t('common:free')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs" data-testid={`book-price-badge-${item.id}`}>
                                ${(item.book.price_minor / 100).toFixed(2)} {item.book.currency_code}
                              </Badge>
                            )}
                            {item.book.hardcopy_available && (
                              <Badge variant="outline" className="text-xs" data-testid={`book-hardcopy-badge-${item.id}`}>
                                {t('student:cart.physicalCopy')}
                              </Badge>
                            )}
                            {item.book.pdf_file_path && (
                              <Badge variant="outline" className="text-xs" data-testid={`book-digital-badge-${item.id}`}>
                                {t('student:cart.digital')}
                              </Badge>
                            )}
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                data-testid={`button-decrease-quantity-${item.id}`}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                                min="1"
                                disabled={updateQuantityMutation.isPending}
                                data-testid={`input-quantity-${item.id}`}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={updateQuantityMutation.isPending}
                                data-testid={`button-increase-quantity-${item.id}`}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100" data-testid={`item-subtotal-${item.id}`}>
                                ${(item.subtotal / 100).toFixed(2)}
                              </span>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={removeItemMutation.isPending}
                                data-testid={`button-remove-item-${item.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2" data-testid="order-summary-title">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      {t('student:cart.orderSummary')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">{t('student:cart.items', {count: cart.total_items})}</span>
                      <span className="font-medium" data-testid="summary-items-total">
                        ${(cart.total_amount / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-400">{t('student:cart.shipping')}</span>
                      <span className="font-medium text-green-600">{t('common:free')}</span>
                    </div>

                    <div className="flex justify-between py-3 text-lg font-bold border-t border-gray-200 dark:border-gray-600">
                      <span>{t('student:cart.total')}</span>
                      <span className="text-indigo-600 dark:text-indigo-400" data-testid="summary-grand-total">
                        ${(cart.total_amount / 100).toFixed(2)}
                      </span>
                    </div>

                    <Link href="/student/checkout">
                      <Button 
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
                        data-testid="button-proceed-to-checkout"
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        {t('student:cart.proceedToCheckout')}
                      </Button>
                    </Link>

                    <Link href="/student/virtual-mall">
                      <Button variant="outline" className="w-full" data-testid="button-continue-shopping">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {t('student:cart.continueShopping')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}