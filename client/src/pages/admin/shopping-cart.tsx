import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Settings, 
  Percent, 
  Timer,
  CreditCard,
  Package,
  Trash,
  Plus
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function ShoppingCartSettings() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cartExpiry: '30',
    maxItems: '10',
    persistentCart: true,
    guestCheckout: false,
    bulkDiscountThreshold: '3',
    bulkDiscountPercent: '10',
    freeShippingThreshold: '50',
    studentDiscount: true,
    requirePhone: true,
    emailReceipt: true,
    checkoutTimeout: '15'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('shoppingCartSettings');
    if (savedSettings) {
      setFormData(JSON.parse(savedSettings));
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      localStorage.setItem('shoppingCartSettings', JSON.stringify(data));
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({ 
        title: t('admin:settingsSaved', 'Settings saved successfully'),
        description: t('admin:cartSettingsSavedDesc', 'Shopping cart settings have been updated')
      });
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:errorSaving', 'Error saving settings'),
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-shopping-cart">
            {t('admin:shoppingCartSettings', 'Shopping Cart Settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-shopping-cart">
            {t('admin:shoppingCartDescription', 'Configure shopping cart behavior, discounts, and checkout process')}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-cart-behavior">
              <ShoppingCart className="h-5 w-5 mr-2 inline" />
              {t('admin:cartBehavior', 'Cart Behavior')}
            </CardTitle>
            <CardDescription>
              {t('admin:cartBehaviorDescription', 'Configure how the shopping cart behaves for users')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cart-expiry">{t('admin:cartExpiryTime', 'Cart Expiry Time (minutes)')}</Label>
                  <Input 
                    id="cart-expiry" 
                    type="number" 
                    defaultValue="30" 
                    data-testid="input-cart-expiry"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin:cartExpiryHint', 'Items will be removed from cart after this time')}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="max-items">{t('admin:maxItemsPerCart', 'Max Items Per Cart')}</Label>
                  <Input 
                    id="max-items" 
                    type="number" 
                    defaultValue="10" 
                    data-testid="input-max-items"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="persistent-cart">{t('admin:persistentCart', 'Persistent Cart')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:persistentCartHint', 'Save cart between sessions')}</p>
                  </div>
                  <Switch id="persistent-cart" defaultChecked data-testid="switch-persistent-cart" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="guest-checkout">{t('admin:guestCheckout', 'Guest Checkout')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:guestCheckoutHint', 'Allow checkout without registration')}</p>
                  </div>
                  <Switch id="guest-checkout" data-testid="switch-guest-checkout" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-discount-rules">
              <Percent className="h-5 w-5 mr-2 inline" />
              {t('admin:discountRules', 'Discount Rules')}
            </CardTitle>
            <CardDescription>
              {t('admin:discountRulesDescription', 'Set up automatic discounts and promotional offers')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulk-discount-threshold">{t('admin:bulkDiscountThreshold', 'Bulk Discount Threshold')}</Label>
                  <Input 
                    id="bulk-discount-threshold" 
                    type="number" 
                    defaultValue="3" 
                    data-testid="input-bulk-threshold"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin:bulkDiscountHint', 'Apply discount when cart contains this many items')}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="bulk-discount-percent">{t('admin:bulkDiscountPercent', 'Bulk Discount Percentage')}</Label>
                  <Input 
                    id="bulk-discount-percent" 
                    type="number" 
                    defaultValue="10" 
                    data-testid="input-bulk-discount"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="free-shipping-threshold">{t('admin:freeShippingThreshold', 'Free Shipping Threshold (€)')}</Label>
                  <Input 
                    id="free-shipping-threshold" 
                    type="number" 
                    defaultValue="50" 
                    data-testid="input-free-shipping"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="student-discount">{t('admin:studentDiscount', 'Student Discount')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:studentDiscountHint', 'Special pricing for students')}</p>
                  </div>
                  <Switch id="student-discount" defaultChecked data-testid="switch-student-discount" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="card-title-checkout-process">
              <CreditCard className="h-5 w-5 mr-2 inline" />
              {t('admin:checkoutProcess', 'Checkout Process')}
            </CardTitle>
            <CardDescription>
              {t('admin:checkoutProcessDescription', 'Configure the checkout flow and requirements')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="require-phone">{t('admin:requirePhoneNumber', 'Require Phone Number')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:requirePhoneHint', 'Mandatory phone for delivery')}</p>
                  </div>
                  <Switch id="require-phone" defaultChecked data-testid="switch-require-phone" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-receipt">{t('admin:emailReceipt', 'Email Receipt')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:emailReceiptHint', 'Send confirmation emails')}</p>
                  </div>
                  <Switch id="email-receipt" defaultChecked data-testid="switch-email-receipt" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="checkout-timeout">{t('admin:checkoutTimeout', 'Checkout Timeout (minutes)')}</Label>
                  <Input 
                    id="checkout-timeout" 
                    type="number" 
                    defaultValue="15" 
                    data-testid="input-checkout-timeout"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('admin:checkoutTimeoutHint', 'Time limit to complete checkout')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" data-testid="button-reset-settings">
            {t('admin:resetToDefault', 'Reset to Default')}
          </Button>
          <Button 
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            data-testid="button-save-cart-settings"
          >
            {saveMutation.isPending ? t('admin:saving', 'Saving...') : t('admin:saveSettings', 'Save Settings')}
          </Button>
        </div>
      </div>
    </div>
  );
}