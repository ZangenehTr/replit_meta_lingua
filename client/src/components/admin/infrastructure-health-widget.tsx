import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

interface TurnStatus {
  configured: boolean;
  status: string;
  serverCount: number;
  servers: string[];
  message: string;
}

interface StunStatus {
  configured: boolean;
  status: string;
  serverCount: number;
  servers: string[];
  message: string;
}

interface OverallStatus {
  productionReady: boolean;
  developmentMode: boolean;
  message: string;
}

interface WebRTCHealthData {
  environment: string;
  turn: TurnStatus;
  stun: StunStatus;
  overall: OverallStatus;
  lastChecked: string;
}

interface InfrastructureServicesData {
  environment: string;
  services: {
    kavenegar: {
      configured: boolean;
      status: string;
      message: string;
    };
    smtp: {
      configured: boolean;
      status: string;
      host: string;
      message: string;
    };
    ollama: {
      configured: boolean;
      status: string;
      host: string;
      model: string;
      message: string;
    };
  };
  lastChecked: string;
}

export function InfrastructureHealthWidget() {
  const { currentLanguage } = useLanguage();
  
  const { data: webrtcHealth, isLoading: webrtcLoading, refetch: refetchWebRTC } = useQuery<WebRTCHealthData>({
    queryKey: ["/api/admin/infrastructure/webrtc-health"],
    refetchInterval: 60000,
  });

  const { data: servicesStatus, isLoading: servicesLoading, refetch: refetchServices } = useQuery<InfrastructureServicesData>({
    queryKey: ["/api/admin/infrastructure/status"],
    refetchInterval: 60000,
  });

  const handleRefresh = () => {
    refetchWebRTC();
    refetchServices();
  };

  if (webrtcLoading || servicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {currentLanguage === 'fa' ? 'وضعیت زیرساخت' : 'Infrastructure Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {currentLanguage === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isProductionReady = webrtcHealth?.overall?.productionReady;
  const isDev = webrtcHealth?.environment === 'development';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {currentLanguage === 'fa' ? 'سلامت زیرساخت WebRTC' : 'WebRTC Infrastructure Health'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDev && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {currentLanguage === 'fa' 
                  ? '⚠️ حالت توسعه: برای استقرار تولید، متغیرهای محیطی TURN/STUN را پیکربندی کنید'
                  : '⚠️ Development Mode: Configure TURN/STUN environment variables for production deployment'}
              </AlertDescription>
            </Alert>
          )}

          {!isDev && isProductionReady && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {currentLanguage === 'fa' 
                  ? '✅ تمام زیرساخت WebRTC عملیاتی و میزبانی شده'
                  : '✅ All WebRTC infrastructure operational and self-hosted'}
              </AlertDescription>
            </Alert>
          )}

          {!isDev && !isProductionReady && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {webrtcHealth?.overall?.message || (currentLanguage === 'fa' 
                  ? 'زیرساخت WebRTC نیاز به پیکربندی دارد'
                  : 'WebRTC infrastructure needs configuration')}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  {currentLanguage === 'fa' ? 'سرور TURN' : 'TURN Server'}
                </h4>
                <Badge variant={webrtcHealth?.turn?.configured ? "default" : "destructive"}>
                  {webrtcHealth?.turn?.status}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {currentLanguage === 'fa' ? 'تعداد سرورها:' : 'Server Count:'} {webrtcHealth?.turn?.serverCount}
                </p>
                {webrtcHealth?.turn?.servers && webrtcHealth.turn.servers.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {currentLanguage === 'fa' ? 'سرورها:' : 'Servers:'}
                    </p>
                    {webrtcHealth.turn.servers.map((server, idx) => (
                      <p key={idx} className="text-xs font-mono bg-muted p-1 rounded">
                        {server}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{webrtcHealth?.turn?.message}</p>
              </div>
            </div>

            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold flex items-center gap-2">
                  {currentLanguage === 'fa' ? 'سرور STUN' : 'STUN Server'}
                </h4>
                <Badge variant={webrtcHealth?.stun?.configured ? "default" : (isDev ? "secondary" : "destructive")}>
                  {webrtcHealth?.stun?.status}
                </Badge>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">
                  {currentLanguage === 'fa' ? 'تعداد سرورها:' : 'Server Count:'} {webrtcHealth?.stun?.serverCount}
                </p>
                {webrtcHealth?.stun?.servers && webrtcHealth.stun.servers.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs">
                      {currentLanguage === 'fa' ? 'سرورها:' : 'Servers:'}
                    </p>
                    {webrtcHealth.stun.servers.map((server, idx) => (
                      <p key={idx} className="text-xs font-mono bg-muted p-1 rounded">
                        {server}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{webrtcHealth?.stun?.message}</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right">
            {currentLanguage === 'fa' ? 'آخرین بررسی:' : 'Last checked:'} {
              webrtcHealth?.lastChecked 
                ? new Date(webrtcHealth.lastChecked).toLocaleString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US')
                : 'N/A'
            }
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentLanguage === 'fa' ? 'وضعیت سرویس‌ها' : 'Services Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {currentLanguage === 'fa' ? 'SMS (Kavenegar)' : 'SMS (Kavenegar)'}
                </h4>
                <Badge variant={servicesStatus?.services?.kavenegar?.configured ? "default" : "destructive"}>
                  {servicesStatus?.services?.kavenegar?.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {servicesStatus?.services?.kavenegar?.message}
              </p>
            </div>

            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {currentLanguage === 'fa' ? 'ایمیل (SMTP)' : 'Email (SMTP)'}
                </h4>
                <Badge variant={servicesStatus?.services?.smtp?.configured ? "default" : "destructive"}>
                  {servicesStatus?.services?.smtp?.status}
                </Badge>
              </div>
              <p className="text-xs font-mono bg-muted p-1 rounded">{servicesStatus?.services?.smtp?.host}</p>
              <p className="text-xs text-muted-foreground">
                {servicesStatus?.services?.smtp?.message}
              </p>
            </div>

            <div className="space-y-2 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">
                  {currentLanguage === 'fa' ? 'هوش مصنوعی (Ollama)' : 'AI (Ollama)'}
                </h4>
                <Badge variant={servicesStatus?.services?.ollama?.configured ? "default" : (isDev ? "secondary" : "destructive")}>
                  {servicesStatus?.services?.ollama?.status}
                </Badge>
              </div>
              <p className="text-xs font-mono bg-muted p-1 rounded">{servicesStatus?.services?.ollama?.host}</p>
              <p className="text-xs font-mono bg-muted p-1 rounded mt-1">Model: {servicesStatus?.services?.ollama?.model}</p>
              <p className="text-xs text-muted-foreground">
                {servicesStatus?.services?.ollama?.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
