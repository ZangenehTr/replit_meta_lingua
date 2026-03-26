import { useState } from "react";
import { useTranslation } from "react-i18next";
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

interface GatewayConfig {
  activeGateway: GatewayName;
  shetab: { merchantId: string; terminalId: string; sandbox: boolean; enabled: boolean };
  zarinpal: { merchantId: string; sandbox: boolean; enabled: boolean };
  idpay: { apiKey: string; sandbox: boolean; enabled: boolean };
  zibal: { merchantId: string; sandbox: boolean; enabled: boolean };
  mellat: { terminalId: string; username: string; password: string; sandbox: boolean; enabled: boolean };
}

function GatewayBadge({ name, active }: { name: GatewayName; active: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? "default" : "outline"} className="ml-2">
      {active ? t("common.active", "Active") : t("common.inactive", "Inactive")}
    </Badge>
  );
}

export default function PaymentGatewayConfigPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testingGateway, setTestingGateway] = useState<GatewayName | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; error?: string }>>({});

  const [form, setForm] = useState<Partial<any>>({});

  const { data: config, isLoading } = useQuery<GatewayConfig>({
    queryKey: ["/api/admin/payment-gateway/config"],
    queryFn: () => apiRequest("GET", "/api/admin/payment-gateway/config").then(r => r.json()),
    onSuccess: (data) => {
      setForm({
        activePaymentGateway: data.activeGateway,
        zarinpalMerchantId: data.zarinpal.merchantId,
        zarinpalEnabled: data.zarinpal.enabled,
        zarinpalSandbox: data.zarinpal.sandbox,
        idpayApiKey: data.idpay.apiKey,
        idpayEnabled: data.idpay.enabled,
        idpaySandbox: data.idpay.sandbox,
        zibalMerchantId: data.zibal.merchantId,
        zibalEnabled: data.zibal.enabled,
        zibalSandbox: data.zibal.sandbox,
        mellatTerminalId: data.mellat.terminalId,
        mellatUsername: data.mellat.username,
        mellatEnabled: data.mellat.enabled,
        mellatSandbox: data.mellat.sandbox,
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/admin/payment-gateway/config", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-gateway/config"] });
      toast({ title: t("common.saved", "Saved"), description: t("admin:paymentGateway.configSaved", "Gateway configuration saved successfully.") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error", "Error"), description: err.message, variant: "destructive" });
    }
  });

  const testGateway = async (gateway: GatewayName) => {
    setTestingGateway(gateway);
    try {
      const resp = await apiRequest("POST", "/api/admin/payment-gateway/test", { gateway });
      const result = await resp.json();
      setTestResults(prev => ({ ...prev, [gateway]: result }));
    } catch (err: any) {
      setTestResults(prev => ({ ...prev, [gateway]: { success: false, error: err.message } }));
    } finally {
      setTestingGateway(null);
    }
  };

  const setActive = (gateway: GatewayName) => {
    setForm(prev => ({ ...prev, activePaymentGateway: gateway }));
  };

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const activeGateway = form.activePaymentGateway as GatewayName || config?.activeGateway || "shetab";

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
          <CardDescription>{t("admin:paymentGateway.activeGatewayDesc", "Select which gateway processes payments")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(["shetab", "zarinpal", "idpay", "zibal", "mellat"] as GatewayName[]).map(gw => (
              <button
                key={gw}
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
                {t("admin:paymentGateway.shetabNote", "Shetab credentials (API key, terminal ID) are managed in the main Admin Settings page under the Payments section.")}
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
                  checked={!!form.zarinpalEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, zarinpalEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.zarinpalSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, zarinpalSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.merchantId", "Merchant ID")}</Label>
                <Input
                  value={form.zarinpalMerchantId || ""}
                  onChange={e => setForm(p => ({ ...p, zarinpalMerchantId: e.target.value }))}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
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
                  checked={!!form.idpayEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, idpayEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.idpaySandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, idpaySandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.apiKey", "API Key")}</Label>
                <Input
                  value={form.idpayApiKey || ""}
                  onChange={e => setForm(p => ({ ...p, idpayApiKey: e.target.value }))}
                  placeholder={t("admin:paymentGateway.apiKeyPlaceholder", "Your IDPay API key")}
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
                  checked={!!form.zibalEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, zibalEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.zibalSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, zibalSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.merchantId", "Merchant ID")}</Label>
                <Input
                  value={form.zibalMerchantId || ""}
                  onChange={e => setForm(p => ({ ...p, zibalMerchantId: e.target.value }))}
                  placeholder={t("admin:paymentGateway.merchantIdPlaceholder", "Your Zibal merchant ID")}
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
                {t("admin:paymentGateway.mellatNote", "Mellat Bank gateway integration (coming soon).")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.mellatEnabled}
                  onCheckedChange={v => setForm(p => ({ ...p, mellatEnabled: v }))}
                />
                <Label>{t("admin:paymentGateway.enabled", "Enable this gateway")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={!!form.mellatSandbox}
                  onCheckedChange={v => setForm(p => ({ ...p, mellatSandbox: v }))}
                />
                <Label>{t("admin:paymentGateway.sandboxMode", "Sandbox / Test Mode")}</Label>
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.terminalId", "Terminal ID")}</Label>
                <Input
                  value={form.mellatTerminalId || ""}
                  onChange={e => setForm(p => ({ ...p, mellatTerminalId: e.target.value }))}
                  placeholder="Terminal ID"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.username", "Username")}</Label>
                <Input
                  value={form.mellatUsername || ""}
                  onChange={e => setForm(p => ({ ...p, mellatUsername: e.target.value }))}
                  placeholder="Username"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("admin:paymentGateway.password", "Password")}</Label>
                <Input
                  value={form.mellatPassword || ""}
                  onChange={e => setForm(p => ({ ...p, mellatPassword: e.target.value }))}
                  type="password"
                  placeholder="Password"
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

function TestButton({
  gateway, testingGateway, testResults, onTest, t
}: {
  gateway: GatewayName;
  testingGateway: GatewayName | null;
  testResults: Record<string, { success: boolean; error?: string }>;
  onTest: (g: GatewayName) => void;
  t: any;
}) {
  const result = testResults[gateway];
  const isTesting = testingGateway === gateway;

  return (
    <div className="flex items-center gap-3 pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTest(gateway)}
        disabled={isTesting}
      >
        {isTesting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wifi className="mr-2 h-4 w-4" />
        )}
        {t("admin:paymentGateway.testConnection", "Test Connection")}
      </Button>
      {result && (
        <span className={`flex items-center gap-1 text-sm ${result.success ? "text-green-600" : "text-destructive"}`}>
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {result.success
            ? t("admin:paymentGateway.connectionOk", "Connected")
            : result.error || t("admin:paymentGateway.connectionFailed", "Connection failed")}
        </span>
      )}
    </div>
  );
}
