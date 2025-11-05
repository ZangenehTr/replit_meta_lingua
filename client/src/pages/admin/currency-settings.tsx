import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Coins, 
  DollarSign, 
  TrendingUp, 
  Globe,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function CurrencySettings() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';
  const { toast } = useToast();

  const [selectedTab, setSelectedTab] = useState("primary");
  const [formData, setFormData] = useState({
    primaryCurrency: 'EUR',
    currencySymbol: '€',
    decimalPlaces: '2',
    symbolPosition: 'before',
    thousandSeparator: true,
    spaceSeparator: false,
    autoSync: true,
    updateFrequency: 'daily',
    rateAlerts: false,
    alertThreshold: '5'
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('currencySettings');
    if (savedSettings) {
      setFormData(JSON.parse(savedSettings));
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      localStorage.setItem('currencySettings', JSON.stringify(data));
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast({ 
        title: t('admin:settingsSaved', 'Settings saved successfully'),
        description: t('admin:currencySettingsSavedDesc', 'Currency settings have been updated')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-currency-settings">
            {t('admin:currencySettings', 'Currency Settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-currency-settings">
            {t('admin:currencyDescription', 'Manage currencies, exchange rates, and payment processing')}
          </p>
        </div>
        <Button variant="outline" data-testid="button-sync-rates">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('admin:syncRates', 'Sync Rates')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-primary-currency-label">
                  {t('admin:primaryCurrency', 'Primary Currency')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-primary-currency-value">EUR</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-supported-currencies-label">
                  {t('admin:supportedCurrencies', 'Supported Currencies')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-supported-currencies-value">8</p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-last-update-label">
                  {t('admin:lastRateUpdate', 'Last Rate Update')}
                </p>
                <p className="text-sm font-bold text-green-600" data-testid="metric-last-update-value">2 hours ago</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="primary" data-testid="tab-primary-currency">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('admin:primary', 'Primary')}
          </TabsTrigger>
          <TabsTrigger value="supported" data-testid="tab-supported-currencies">
            <Globe className="h-4 w-4 mr-2" />
            {t('admin:supported', 'Supported')}
          </TabsTrigger>
          <TabsTrigger value="rates" data-testid="tab-exchange-rates">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('admin:exchangeRates', 'Exchange Rates')}
          </TabsTrigger>
          <TabsTrigger value="automation" data-testid="tab-automation">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('admin:automation', 'Automation')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="primary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-primary-currency">
                {t('admin:primaryCurrencySettings', 'Primary Currency Settings')}
              </CardTitle>
              <CardDescription>
                {t('admin:primaryCurrencyDescription', 'Set the main currency for your platform')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primary-currency">{t('admin:selectPrimaryCurrency', 'Select Primary Currency')}</Label>
                    <Select defaultValue="EUR">
                      <SelectTrigger data-testid="select-primary-currency">
                        <SelectValue placeholder={t('admin:chooseCurrency', 'Choose currency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="IRR">IRR - Iranian Rial</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency-symbol">{t('admin:currencySymbol', 'Currency Symbol')}</Label>
                    <Input 
                      id="currency-symbol" 
                      defaultValue="€" 
                      data-testid="input-currency-symbol"
                    />
                  </div>

                  <div>
                    <Label htmlFor="decimal-places">{t('admin:decimalPlaces', 'Decimal Places')}</Label>
                    <Input 
                      id="decimal-places" 
                      type="number" 
                      defaultValue="2" 
                      min="0" 
                      max="4"
                      data-testid="input-decimal-places"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="symbol-position">{t('admin:symbolPosition', 'Symbol Position')}</Label>
                    <Select defaultValue="before">
                      <SelectTrigger data-testid="select-symbol-position">
                        <SelectValue placeholder={t('admin:choosePosition', 'Choose position')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">{t('admin:beforeAmount', 'Before Amount (€100)')}</SelectItem>
                        <SelectItem value="after">{t('admin:afterAmount', 'After Amount (100€)')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="thousand-separator">{t('admin:thousandSeparator', 'Thousand Separator')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:thousandSeparatorHint', 'Use comma for thousands')}</p>
                    </div>
                    <Switch id="thousand-separator" defaultChecked data-testid="switch-thousand-separator" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="space-separator">{t('admin:spaceSeparator', 'Space Separator')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:spaceSeparatorHint', 'Space between symbol and amount')}</p>
                    </div>
                    <Switch id="space-separator" data-testid="switch-space-separator" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supported" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-supported-currencies">
                {t('admin:supportedCurrenciesManagement', 'Supported Currencies Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:supportedCurrenciesDescription', 'Enable and configure additional currencies')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['USD', 'GBP', 'IRR', 'CAD', 'AUD', 'JPY'].map((currency) => (
                    <div key={currency} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Coins className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{currency}</p>
                          <p className="text-sm text-gray-500">
                            {currency === 'USD' && 'US Dollar'}
                            {currency === 'GBP' && 'British Pound'}
                            {currency === 'IRR' && 'Iranian Rial'}
                            {currency === 'CAD' && 'Canadian Dollar'}
                            {currency === 'AUD' && 'Australian Dollar'}
                            {currency === 'JPY' && 'Japanese Yen'}
                          </p>
                        </div>
                      </div>
                      <Switch 
                        defaultChecked={['USD', 'GBP', 'IRR'].includes(currency)}
                        data-testid={`switch-currency-${currency.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-exchange-rates">
                {t('admin:exchangeRatesManagement', 'Exchange Rates Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:exchangeRatesDescription', 'View and manage currency exchange rates')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-rates-loading">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingExchangeRates', 'Loading exchange rates...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-automation-settings">
                {t('admin:automationSettings', 'Automation Settings')}
              </CardTitle>
              <CardDescription>
                {t('admin:automationDescription', 'Configure automatic rate updates and notifications')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-update">{t('admin:autoUpdateRates', 'Auto Update Rates')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:autoUpdateHint', 'Automatically fetch latest rates')}</p>
                    </div>
                    <Switch id="auto-update" defaultChecked data-testid="switch-auto-update" />
                  </div>

                  <div>
                    <Label htmlFor="update-frequency">{t('admin:updateFrequency', 'Update Frequency')}</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger data-testid="select-update-frequency">
                        <SelectValue placeholder={t('admin:chooseFrequency', 'Choose frequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">{t('admin:hourly', 'Hourly')}</SelectItem>
                        <SelectItem value="daily">{t('admin:daily', 'Daily')}</SelectItem>
                        <SelectItem value="weekly">{t('admin:weekly', 'Weekly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="rate-alerts">{t('admin:rateChangeAlerts', 'Rate Change Alerts')}</Label>
                      <p className="text-sm text-gray-500">{t('admin:rateAlertsHint', 'Notify on significant changes')}</p>
                    </div>
                    <Switch id="rate-alerts" data-testid="switch-rate-alerts" />
                  </div>

                  <div>
                    <Label htmlFor="alert-threshold">{t('admin:alertThreshold', 'Alert Threshold (%)' )}</Label>
                    <Input 
                      id="alert-threshold" 
                      type="number" 
                      defaultValue="5" 
                      data-testid="input-alert-threshold"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" data-testid="button-reset-currency-settings">
          {t('admin:resetToDefault', 'Reset to Default')}
        </Button>
        <Button 
          onClick={() => saveMutation.mutate(formData)}
          disabled={saveMutation.isPending}
          data-testid="button-save-currency-settings"
        >
          {saveMutation.isPending ? t('admin:saving', 'Saving...') : t('admin:saveSettings', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}