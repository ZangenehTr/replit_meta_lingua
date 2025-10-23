import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  Package, 
  CreditCard, 
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function EcommerceManagement() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("products");

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-ecommerce">
            {t('admin:ecommerceManagement', 'E-commerce Management')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-ecommerce">
            {t('admin:ecommerceDescription', 'Manage products, orders, and payment settings for the learning platform')}
          </p>
        </div>
        <Button data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin:addProduct', 'Add Product')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-total-products-label">
                  {t('admin:totalProducts', 'Total Products')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-total-products-value">47</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-monthly-orders-label">
                  {t('admin:monthlyOrders', 'Monthly Orders')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-monthly-orders-value">128</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-revenue-label">
                  {t('admin:monthlyRevenue', 'Monthly Revenue')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-revenue-value">€12,450</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-growth-label">
                  {t('admin:growth', 'Growth')}
                </p>
                <p className="text-2xl font-bold text-green-600" data-testid="metric-growth-value">+23%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="h-4 w-4 mr-2" />
            {t('admin:products', 'Products')}
          </TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            {t('admin:orders', 'Orders')}
          </TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">
            <CreditCard className="h-4 w-4 mr-2" />
            {t('admin:payments', 'Payments')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('admin:analytics', 'Analytics')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-product-catalog">
                {t('admin:productCatalog', 'Product Catalog')}
              </CardTitle>
              <CardDescription>
                {t('admin:productCatalogDescription', 'Manage books, courses, and educational materials')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-products-loading">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingProducts', 'Loading products...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-order-management">
                {t('admin:orderManagement', 'Order Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:orderManagementDescription', 'Process and track customer orders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-orders-loading">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingOrders', 'Loading orders...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-payment-settings">
                {t('admin:paymentSettings', 'Payment Settings')}
              </CardTitle>
              <CardDescription>
                {t('admin:paymentSettingsDescription', 'Configure payment gateways and processing')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="stripe-enabled">{t('admin:stripePayments', 'Stripe Payments')}</Label>
                    <p className="text-sm text-gray-500">{t('admin:stripeDescription', 'Accept international payments')}</p>
                  </div>
                  <Switch id="stripe-enabled" data-testid="switch-stripe-enabled" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-sales-analytics">
                {t('admin:salesAnalytics', 'Sales Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:salesAnalyticsDescription', 'Track sales performance and trends')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-analytics-loading">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingAnalytics', 'Loading analytics data...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}