import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ShoppingCart, 
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Wallet,
  MapPin,
  User,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Package,
  Truck,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EnhancedCart, CheckoutStep, PaymentMethod, CheckoutFormData } from '@/types/ecommerce';

// Checkout form validation schema
const checkoutSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  address_line1: z.string().min(5, "Address must be at least 5 characters"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().optional(),
  postal_code: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  payment_method: z.enum(['wallet', 'card', 'cash']),
  order_notes: z.string().optional(),
  save_address: z.boolean().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function StudentCheckout() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['student', 'common']);
  const isRTL = i18n.language === 'fa' || i18n.language === 'ar';
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Checkout steps
  const steps: CheckoutStep[] = [
    {
      id: 'review',
      title: t('student:checkout.steps.reviewCart'),
      description: t('student:checkout.steps.reviewDescription'),
      isCompleted: false,
      isActive: currentStep === 0,
      isDisabled: false
    },
    {
      id: 'details',
      title: t('student:checkout.steps.customerDetails'),
      description: t('student:checkout.steps.detailsDescription'),
      isCompleted: false,
      isActive: currentStep === 1,
      isDisabled: currentStep < 1
    },
    {
      id: 'payment',
      title: t('student:checkout.steps.payment'),
      description: t('student:checkout.steps.paymentDescription'),
      isCompleted: false,
      isActive: currentStep === 2,
      isDisabled: currentStep < 2
    },
    {
      id: 'confirmation',
      title: t('student:checkout.steps.confirmation'),
      description: t('student:checkout.steps.confirmationDescription'),
      isCompleted: false,
      isActive: currentStep === 3,
      isDisabled: currentStep < 3
    }
  ];

  // Form setup
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      first_name: user?.firstName || '',
      last_name: user?.lastName || '',
      phone: user?.phoneNumber || '',
      country: 'US',
      payment_method: 'wallet',
      save_address: true
    }
  });

  // Fetch cart data
  const { data: cartResponse, isLoading: cartLoading } = useQuery<{success: boolean; data: EnhancedCart}>({
    queryKey: ['/api/cart'],
    enabled: !!user
  });

  // Fetch user addresses
  const { data: addressesResponse } = useQuery<{success: boolean; data: any[]}>({
    queryKey: ['/api/addresses'],
    enabled: !!user
  });

  // Fetch user wallet balance
  const { data: walletResponse } = useQuery<{success: boolean; data: {balance: number}}>({
    queryKey: ['/api/wallet/balance'],
    enabled: !!user
  });

  const cart = cartResponse?.data;
  const addresses = addressesResponse?.data || [];
  const walletBalance = walletResponse?.data?.balance || 0;

  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'wallet',
      type: 'wallet',
      title: t('student:checkout.payment.wallet'),
      description: t('student:checkout.payment.walletDescription', { balance: walletBalance }),
      icon: 'wallet',
      available: walletBalance >= (cart?.total_amount || 0),
      balance: walletBalance
    },
    {
      id: 'card',
      type: 'card',
      title: t('student:checkout.payment.creditCard'),
      description: t('student:checkout.payment.cardDescription'),
      icon: 'card',
      available: true
    },
    {
      id: 'cash',
      type: 'cash',
      title: t('student:checkout.payment.cashOnDelivery'),
      description: t('student:checkout.payment.cashDescription'),
      icon: 'cash',
      available: true
    }
  ];

  // Process checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues) => {
      setIsProcessing(true);
      const response = await apiRequest('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customer_info: {
            email: data.email,
            phone: data.phone,
            first_name: data.first_name,
            last_name: data.last_name
          },
          shipping_address: {
            full_name: `${data.first_name} ${data.last_name}`,
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country,
            phone: data.phone
          },
          payment_method: data.payment_method,
          order_notes: data.order_notes,
          save_address: data.save_address
        })
      });
      return response;
    },
    onSuccess: (response) => {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      if (response.success) {
        toast({
          title: t('student:checkout.success'),
          description: t('student:checkout.orderPlaced', { orderId: response.data.order_id }),
          variant: "default"
        });
        setLocation(`/student/order-confirmation/${response.data.order_id}`);
      }
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: t('common:error'),
        description: error.message || t('student:checkout.error'),
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CheckoutFormValues) => {
    checkoutMutation.mutate(data);
  };

  // Navigate between steps
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Loading state
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-12" data-testid="checkout-loading">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-400">{t('student:checkout.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart redirect
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto p-6">
          <div className="text-center py-16" data-testid="checkout-empty-cart">
            <Package className="w-16 h-16 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              {t('student:checkout.emptyCart')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('student:checkout.emptyCartMessage')}
            </p>
            <Link href="/student/virtual-mall">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <BookOpen className="w-4 h-4 mr-2" />
                {t('student:checkout.browseCatalog')}
              </Button>
            </Link>
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
              <Link href="/student/cart">
                <Button variant="ghost" size="sm" data-testid="button-back-to-cart">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('student:checkout.backToCart')}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="page-title-checkout">
                    {t('student:checkout.title')}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('student:checkout.secure')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center" data-testid={`checkout-step-${step.id}`}>
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.isActive ? 'bg-indigo-600 text-white' : 
                      step.isCompleted ? 'bg-green-600 text-white' : 
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                  `}>
                    {step.isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${step.isActive ? 'text-indigo-600' : 'text-gray-600 dark:text-gray-400'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 ml-4 mr-4">
                      <div className={`h-0.5 ${step.isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Review Cart */}
              {currentStep === 0 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" data-testid="review-cart-title">
                        <ShoppingCart className="w-5 h-5 text-indigo-600" />
                        {t('student:checkout.reviewYourOrder')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600" data-testid={`review-item-${item.id}`}>
                          <div className="w-16 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1" data-testid={`review-book-title-${item.id}`}>
                              {item.book.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {t('student:checkout.byAuthor', {author: item.book.author})}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t('student:checkout.quantity', {quantity: item.quantity})}
                              </span>
                              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100" data-testid={`review-item-total-${item.id}`}>
                                ${((item.book.price as any) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Customer Details */}
              {currentStep === 1 && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" data-testid="customer-details-title">
                        <User className="w-5 h-5 text-indigo-600" />
                        {t('student:checkout.customerInformation')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {t('student:checkout.firstName')}
                          </Label>
                          <Input
                            id="first_name"
                            {...form.register('first_name')}
                            placeholder={t('student:checkout.firstNamePlaceholder')}
                            data-testid="input-first-name"
                            className={form.formState.errors.first_name ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.first_name && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.first_name.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="last_name" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {t('student:checkout.lastName')}
                          </Label>
                          <Input
                            id="last_name"
                            {...form.register('last_name')}
                            placeholder={t('student:checkout.lastNamePlaceholder')}
                            data-testid="input-last-name"
                            className={form.formState.errors.last_name ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.last_name && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.last_name.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {t('student:checkout.email')}
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register('email')}
                            placeholder={t('student:checkout.emailPlaceholder')}
                            data-testid="input-email"
                            className={form.formState.errors.email ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.email && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {t('student:checkout.phone')}
                          </Label>
                          <Input
                            id="phone"
                            {...form.register('phone')}
                            placeholder={t('student:checkout.phonePlaceholder')}
                            data-testid="input-phone"
                            className={form.formState.errors.phone ? 'border-red-500' : ''}
                          />
                          {form.formState.errors.phone && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.phone.message}</p>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Shipping Address */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                          {t('student:checkout.shippingAddress')}
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="address_line1">{t('student:checkout.addressLine1')}</Label>
                            <Input
                              id="address_line1"
                              {...form.register('address_line1')}
                              placeholder={t('student:checkout.addressLine1Placeholder')}
                              data-testid="input-address-line1"
                              className={form.formState.errors.address_line1 ? 'border-red-500' : ''}
                            />
                            {form.formState.errors.address_line1 && (
                              <p className="text-sm text-red-500 mt-1">{form.formState.errors.address_line1.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="address_line2">{t('student:checkout.addressLine2')}</Label>
                            <Input
                              id="address_line2"
                              {...form.register('address_line2')}
                              placeholder={t('student:checkout.addressLine2Placeholder')}
                              data-testid="input-address-line2"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="city">{t('student:checkout.city')}</Label>
                              <Input
                                id="city"
                                {...form.register('city')}
                                placeholder={t('student:checkout.cityPlaceholder')}
                                data-testid="input-city"
                                className={form.formState.errors.city ? 'border-red-500' : ''}
                              />
                              {form.formState.errors.city && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.city.message}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="state">{t('student:checkout.state')}</Label>
                              <Input
                                id="state"
                                {...form.register('state')}
                                placeholder={t('student:checkout.statePlaceholder')}
                                data-testid="input-state"
                              />
                            </div>
                            <div>
                              <Label htmlFor="postal_code">{t('student:checkout.postalCode')}</Label>
                              <Input
                                id="postal_code"
                                {...form.register('postal_code')}
                                placeholder={t('student:checkout.postalCodePlaceholder')}
                                data-testid="input-postal-code"
                                className={form.formState.errors.postal_code ? 'border-red-500' : ''}
                              />
                              {form.formState.errors.postal_code && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.postal_code.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="save_address" 
                              {...form.register('save_address')}
                              data-testid="checkbox-save-address"
                            />
                            <Label htmlFor="save_address" className="text-sm">
                              {t('student:checkout.saveAddress')}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 2 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2" data-testid="payment-method-title">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        {t('student:checkout.paymentMethod')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <RadioGroup
                        value={form.watch('payment_method')}
                        onValueChange={(value) => form.setValue('payment_method', value as any)}
                        data-testid="payment-method-group"
                      >
                        {paymentMethods.map((method) => (
                          <div key={method.id} className={`
                            flex items-center space-x-3 p-4 rounded-xl border-2 transition-colors
                            ${form.watch('payment_method') === method.type ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'}
                            ${!method.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-300'}
                          `}>
                            <RadioGroupItem 
                              value={method.type} 
                              id={method.id} 
                              disabled={!method.available}
                              data-testid={`payment-method-${method.type}`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {method.icon === 'wallet' && <Wallet className="w-5 h-5 text-green-600" />}
                                {method.icon === 'card' && <CreditCard className="w-5 h-5 text-blue-600" />}
                                {method.icon === 'cash' && <Truck className="w-5 h-5 text-orange-600" />}
                                <Label htmlFor={method.id} className="font-medium">
                                  {method.title}
                                </Label>
                                {!method.available && (
                                  <Badge variant="destructive" className="text-xs">
                                    {t('student:checkout.unavailable')}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {method.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>

                      <div>
                        <Label htmlFor="order_notes">{t('student:checkout.orderNotes')}</Label>
                        <Textarea
                          id="order_notes"
                          {...form.register('order_notes')}
                          placeholder={t('student:checkout.orderNotesPlaceholder')}
                          rows={3}
                          data-testid="textarea-order-notes"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                data-testid="button-previous-step"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('student:checkout.previous')}
              </Button>

              {currentStep < 2 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  data-testid="button-next-step"
                >
                  {t('student:checkout.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isProcessing || checkoutMutation.isPending}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  data-testid="button-place-order"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('student:checkout.processing')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t('student:checkout.placeOrder')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2" data-testid="order-summary-sidebar-title">
                  <Package className="w-5 h-5 text-green-600" />
                  {t('student:checkout.orderSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm" data-testid={`summary-item-${item.id}`}>
                      <span className="truncate mr-2">
                        {item.book.title} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${((item.book.price as any) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:checkout.subtotal')}</span>
                    <span className="font-medium" data-testid="summary-subtotal">
                      ${cart.total_amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:checkout.shipping')}</span>
                    <span className="font-medium text-green-600">{t('common:free')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('student:checkout.tax')}</span>
                    <span className="font-medium">$0.00</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{t('student:checkout.total')}</span>
                    <span className="text-indigo-600 dark:text-indigo-400" data-testid="summary-grand-total">
                      ${cart.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('student:checkout.securePayment')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}