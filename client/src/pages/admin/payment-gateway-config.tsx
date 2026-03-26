import { useState, useEffect } from "react";
import { useTranslation, type TFunction } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Loader2, Wifi } from "lucide-react";

type GatewayName = "shetab" | "zarinpal" | "idpay" | "zibal" | "mellat";

interface GatewayInfo {
  isEnabled: boolean;
  sandboxMode: boolean;
  hasCredentials: boolean;
}

interface GatewayConfig {
  activeGateway: GatewayName;
  gateways: Record<GatewayName, GatewayInfo>;
}

interface GatewayFormState {
  activePaymentGateway: GatewayName;
  zarinpalMerchantId: string;
  zarinpalEnabled: boolean;
  zarinpalSandbox: boolean;
  idpayApiKey: string;
  idpayEnabled: boolean;
  idpaySandbox: boolean;
  zibalMerchantId: string;
  zibalEnabled: boolean;
  zibalSandbox: boolean;
  mellatTerminalId: string;
  mellatUsername: string;
  mellatPassword: string;
  mellatEnabled: boolean;
  mellatSandbox: boolean;
}

type TestResult = { success: boolean; error?: string };

interface TestButtonProps {
  gateway: GatewayName;
  testingGateway: GatewayName | null;
  testResults: Partial<Record<GatewayName, TestResult>>;
  onTest: (g: GatewayName) => void;
  t: TFunction;
}

function GatewayBadge({ name, active }: { name: GatewayName; active: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? "default" : "outline"} className="ml-2">
      {active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
    </Badge>
  );
}

function TestButton({ gateway, testingGateway, testResults, onTest, t }: TestButtonProps) {
  const result = testResults[gateway];
  const isTesting = testingGateway === gateway;

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button variant="outline" size="sm" onClick={() => onTest(gateway)} disabled={isTesting}>
        {isTesting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wifi className="mr-2 h-4 w-4" />
        )}
        {t("admin:paymentGateway.testConnection", "Test Connection")}
      </Button>
      {result && (
        <span className={`flex items-center gap-1 text-sm ${result.success ? "text-green-600" : "text-destructive"}`}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {result.success
            ? t("admin:paymentGateway.connectionOk", "Connected")
            : (result.error ?? t("admin:paymentGateway.connectionFailed", "Connection failed"))}
        </span>
      )}
    </div>
  );
}

const emptyForm = (): GatewayFormState => ({
  activePaymentGateway: "shetab",
  zarinpalMerchantId: "",
  zarinpalEnabled: false,
  zarinpalSandbox: true,
  idpayApiKey: "",
  idpayEnabled: false,
  idpaySandbox: true,
  zibalMerchantId: "",
  zibalEnabled: false,
  zibalSandbox: true,
  mellatTerminalId: "",
  mellatUsername: "",
  mellatPassword: "",
  mellatEnabled: false,
  mellatSandbox: true,
});

export default function PaymentGatewayConfigPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingGateway, setTestingGateway] = useState<GatewayName | null>(null);
  const [testResults, setTestResults] = useState<Partial<Record<GatewayName, TestResult>>>({});
  const [form, setForm] = useState<GatewayFormState>(emptyForm);

  const { data: config, isLoading } = useQuery<GatewayConfig>({
    queryKey: ["/api/admin/payment-gateway/config"],
    queryFn: () => apiRequest("GET", "/api/admin/payment-gateway/config").then(r => r.json()),
  });

  useEffect(() => {
    if (config) {
      const gw = config.gateways;
      setForm(prev => ({
        ...prev,
        activePaymentGateway: config.activeGateway,
        zarinpalEnabled: gw.zarinpal?.isEnabled ?? false,
        zarinpalSandbox: gw.zarinpal?.sandboxMode ?? true,
        idpayEnabled: gw.idpay?.isEnabled ?? false,
        idpaySandbox: gw.idpay?.sandboxMode ?? true,
        zibalEnabled: gw.zibal?.isEnabled ?? false,
        zibalSandbox: gw.zibal?.sandboxMode ?? true,
        mellatEnabled: gw.mellat?.isEnabled ?? false,
        mellatSandbox: gw.mellat?.sandboxMode ?? true,
      }));
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<GatewayFormState>) =>
      apiRequest("PUT", "/api/admin/payment-gateway/config", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateway/config"] });
      toast({
        title: t("common.saved", "Saved"),
        description: t("admin:paymentGateway.configSaved", "Gateway configuration saved successfully."),
      });
    },
    onError: (err: Error) => {
      toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" });
    },
  });

  const testGateway = async (gateway: GatewayName) => {
    setTestingGateway(gateway);
    try {
      const resp = await apiRequest("POST", "/api/admin/payment-gateway/test", { gateway });
      const result = (await resp.json()) as TestResult;
      setTestResults(prev => ({ ...prev, [gateway]: result }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setTestResults(prev => ({ ...prev, [gateway]: { success: false, error: msg } }));
    } finally {
      setTestingGateway(null);
    }
  };

  const setActive = (gateway: GatewayName) => {
    setForm(prev => ({ ...prev, activePaymentGateway: gateway }));
  };

  const handleSave = () => {
    if (form.activePaymentGateway === "mellat") {
      toast({
        title: t("common.error", "Error"),
        description: t("admin:paymentGateway.mellatNotReady", "Mellat Bank gateway is not yet fully implemented. Please select another active gateway."),
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activeGateway = form.activePaymentGateway;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin:paymentGateway.title", "Payment Gateway Configuration")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("admin:paymentGateway.subtitle", "Configure Iranian payment gateways. The active gateway will be used for all new transactions.")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin:paymentGateway.activeGateway", "Active Gateway")}</CardTitle>
          <CardDescription>
            {t("admin:paymentGateway.activeGatewayDesc", "Select which gateway processes payments")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["shetab", "zarinpal", "idpay", "zibal", "mellat"] as GatewayName[]).map(gw => (
              <button
                key={gw}
                type="button"
                onClick={() => setActive(gw)}
                className={`p-4 rounded-lg border-2 text-center transition-all font-medium capitalize ${
                  activeGateway === gw
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {gw}
                {activeGateway === gw && (
                  <div className="text-xs mt-1 text-primary">{t("common.selected", "Selected")}</div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="shetab">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="shetab">Shetab</TabsTrigger>
          <TabsTrigger value="zarinpal">Zarinpal</TabsTrigger>
          <TabsTrigger value="idpay">IDPay</TabsTrigger>
          <TabsTrigger value="zibal">Zibal</TabsTrigger>
          <TabsTrigger value="mellat">Mellat</TabsTrigger>
        </TabsList>

        <TabsContent value="shetab">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Shetab (درگاه شتاب)
                <GatewayBadge name="shetab" active={activeGateway === "shetab"} />
              </CardTitle>
              <CardDescription>
                {t("admin:paymentGateway.shetabDesc", "Configure existing Shetab/SHAPARAK gateway in Admin Settings.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                {t("admin:paymentGateway.shetabNote", "Shetab credentials (API key, terminal ID) are managed in the main Admin Settings page.")}
              </div>
              <TestButton gateway="shetab" testingGateway={testingGateway} testResults={testResults} onTest={testGateway} t={t} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zarinpal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Zarinpal (زرین‌پال)
                <GatewayBadge name="zarinpal" active={activeGateway === "zarinpal"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.zarinpalEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, zarinpalEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.zarinpalSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, zarinpalSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.merchantId", "Merchant ID")}</Label>
                {config?.gateways.zarinpal?.hasCredentials && !form.zarinpalMerchantId && (
                  <p className="text-xs text-muted-foreground">
                    {t("admin:paymentGateway.credentialSet", "A credential is already set. Enter a new value to replace it.")}
                  </p>
                )}
                <Input
                  value={form.zarinpalMerchantId}
                  onChange={e => setForm(p => ({ ...p, zarinpalMerchantId: e.target.value }))}
                  placeholder={
                    config?.gateways.zarinpal?.hasCredentials
                      ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep existing credential")
                      : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  }
                  dir="ltr"
                />
              </div>
              <TestButton gateway="zarinpal" testingGateway={testingGateway} testResults={testResults} onTest={testGateway} t={t} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idpay">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                IDPay (آیدی پی)
                <GatewayBadge name="idpay" active={activeGateway === "idpay"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.idpayEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, idpayEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.idpaySandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, idpaySandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.apiKey", "API Key")}</Label>
                {config?.gateways.idpay?.hasCredentials && !form.idpayApiKey && (
                  <p className="text-xs text-muted-foreground">
                    {t("admin:paymentGateway.credentialSet", "A credential is already set. Enter a new value to replace it.")}
                  </p>
                )}
                <Input
                  value={form.idpayApiKey}
                  onChange={e => setForm(p => ({ ...p, idpayApiKey: e.target.value }))}
                  placeholder={
                    config?.gateways.idpay?.hasCredentials
                      ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep existing credential")
                      : t("admin:paymentGateway.apiKeyPlaceholder", "Your IDPay API key")
                  }
                  type="password"
                  dir="ltr"
                />
              </div>
              <TestButton gateway="idpay" testingGateway={testingGateway} testResults={testResults} onTest={testGateway} t={t} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zibal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Zibal (زیبال)
                <GatewayBadge name="zibal" active={activeGateway === "zibal"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.zibalEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, zibalEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.zibalSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, zibalSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.merchantId", "Merchant ID")}</Label>
                {config?.gateways.zibal?.hasCredentials && !form.zibalMerchantId && (
                  <p className="text-xs text-muted-foreground">
                    {t("admin:paymentGateway.credentialSet", "A credential is already set. Enter a new value to replace it.")}
                  </p>
                )}
                <Input
                  value={form.zibalMerchantId}
                  onChange={e => setForm(p => ({ ...p, zibalMerchantId: e.target.value }))}
                  placeholder={
                    config?.gateways.zibal?.hasCredentials
                      ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep existing credential")
                      : t("admin:paymentGateway.merchantIdPlaceholder", "Your Zibal merchant ID")
                  }
                  dir="ltr"
                />
              </div>
              <TestButton gateway="zibal" testingGateway={testingGateway} testResults={testResults} onTest={testGateway} t={t} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mellat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Mellat Bank (بانک ملت)
                <GatewayBadge name="mellat" active={activeGateway === "mellat"} />
              </CardTitle>
              <CardDescription>
                {t("admin:paymentGateway.mellatNote", "Mellat Bank gateway – credential storage available. Full SOAP integration coming soon.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.mellatEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, mellatEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.mellatSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, mellatSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.terminalId", "Terminal ID")}</Label>
                <Input
                  value={form.mellatTerminalId}
                  onChange={e => setForm(p => ({ ...p, mellatTerminalId: e.target.value }))}
                  placeholder={config?.gateways.mellat?.hasCredentials ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep") : "Terminal ID"}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.username", "Username")}</Label>
                <Input
                  value={form.mellatUsername}
                  onChange={e => setForm(p => ({ ...p, mellatUsername: e.target.value }))}
                  placeholder={config?.gateways.mellat?.hasCredentials ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep") : "Username"}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.password", "Password")}</Label>
                <Input
                  value={form.mellatPassword}
                  onChange={e => setForm(p => ({ ...p, mellatPassword: e.target.value }))}
                  type="password"
                  placeholder={config?.gateways.mellat?.hasCredentials ? t("admin:paymentGateway.leaveBlankToKeep", "Leave blank to keep") : "Password"}
                  dir="ltr"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("common.saveChanges", "Save Changes")}
        </Button>
      </div>
    </div>
  );
}
