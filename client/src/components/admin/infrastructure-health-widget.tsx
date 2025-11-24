import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { Server, Wifi, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InfrastructureHealth {
  webrtc: {
    turn: {
      configured: boolean;
      status: 'healthy' | 'unhealthy' | 'not_configured';
      url?: string;
      lastChecked?: string;
    };
    stun: {
      configured: boolean;
      status: 'healthy' | 'unhealthy' | 'not_configured';
      primaryUrl?: string;
      backupUrl?: string;
      lastChecked?: string;
    };
  };
  smtp: {
    configured: boolean;
    status: 'healthy' | 'unhealthy' | 'not_configured';
    host?: string;
    port?: number;
    lastChecked?: string;
  };
  kavenegar: {
    configured: boolean;
    status: 'healthy' | 'unhealthy' | 'not_configured';
    lastChecked?: string;
  };
}

function StatusBadge({ status }: { status: 'healthy' | 'unhealthy' | 'not_configured' }) {
  const { language } = useLanguage();
  
  if (status === 'healthy') {
    return (
      <Badge variant="default" className="bg-green-500">
        {language === 'fa' ? '🟢 سالم' : '🟢 Healthy'}
      </Badge>
    );
  }
  
  if (status === 'unhealthy') {
    return (
      <Badge variant="destructive">
        {language === 'fa' ? '🔴 ناسالم' : '🔴 Unhealthy'}
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary">
      {language === 'fa' ? '⚪ پیکربندی نشده' : '⚪ Not Configured'}
    </Badge>
  );
}

export function InfrastructureHealthWidget() {
  const { language } = useLanguage();
  
  const { data: health, isLoading, refetch } = useQuery<InfrastructureHealth>({
    queryKey: ["/api/admin/infrastructure/health"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت زیرساخت' : 'Infrastructure Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === 'fa' ? 'در حال بارگذاری...' : 'Loading...'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت زیرساخت' : 'Infrastructure Status'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {language === 'fa' ? 'بروزرسانی' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WebRTC TURN Server */}
        <div className="flex items-start justify-between p-3 rounded-lg border">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 mt-0.5 text-blue-500" />
            <div>
              <h4 className="font-medium">
                {language === 'fa' ? 'سرور TURN' : 'TURN Server'}
              </h4>
              {health.webrtc.turn.url && (
                <p className="text-sm text-muted-foreground font-mono">
                  {health.webrtc.turn.url}
                </p>
              )}
              {!health.webrtc.turn.configured && (
                <p className="text-sm text-muted-foreground">
                  {language === 'fa' 
                    ? 'برای تماس ویدیویی نیاز است - TURN_SERVER_URL را تنظیم کنید' 
                    : 'Required for video calls - Set TURN_SERVER_URL'}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={health.webrtc.turn.status} />
        </div>

        {/* WebRTC STUN Server */}
        <div className="flex items-start justify-between p-3 rounded-lg border">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 mt-0.5 text-purple-500" />
            <div>
              <h4 className="font-medium">
                {language === 'fa' ? 'سرور STUN' : 'STUN Server'}
              </h4>
              {health.webrtc.stun.primaryUrl && (
                <>
                  <p className="text-sm text-muted-foreground font-mono">
                    {language === 'fa' ? 'اصلی: ' : 'Primary: '}{health.webrtc.stun.primaryUrl}
                  </p>
                  {health.webrtc.stun.backupUrl && (
                    <p className="text-sm text-muted-foreground font-mono">
                      {language === 'fa' ? 'پشتیبان: ' : 'Backup: '}{health.webrtc.stun.backupUrl}
                    </p>
                  )}
                </>
              )}
              {!health.webrtc.stun.configured && (
                <p className="text-sm text-muted-foreground">
                  {language === 'fa' 
                    ? 'برای اتصال NAT نیاز است - STUN_SERVER_URL را تنظیم کنید' 
                    : 'Required for NAT traversal - Set STUN_SERVER_URL'}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={health.webrtc.stun.status} />
        </div>

        {/* SMTP Email */}
        <div className="flex items-start justify-between p-3 rounded-lg border">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 mt-0.5 text-green-500" />
            <div>
              <h4 className="font-medium">
                {language === 'fa' ? 'سرور ایمیل (SMTP)' : 'Email Server (SMTP)'}
              </h4>
              {health.smtp.host && (
                <p className="text-sm text-muted-foreground">
                  {health.smtp.host}:{health.smtp.port || 587}
                </p>
              )}
              {!health.smtp.configured && (
                <p className="text-sm text-muted-foreground">
                  {language === 'fa' 
                    ? 'برای ارسال ایمیل نیاز است - SMTP_HOST را تنظیم کنید' 
                    : 'Required for email delivery - Set SMTP_HOST'}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={health.smtp.status} />
        </div>

        {/* Kavenegar SMS */}
        <div className="flex items-start justify-between p-3 rounded-lg border">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 mt-0.5 text-orange-500" />
            <div>
              <h4 className="font-medium">
                {language === 'fa' ? 'سرویس پیامک (کاوه‌نگار)' : 'SMS Service (Kavenegar)'}
              </h4>
              {health.kavenegar.configured ? (
                <p className="text-sm text-muted-foreground">
                  {language === 'fa' ? 'کلید API پیکربندی شده' : 'API Key Configured'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {language === 'fa' 
                    ? 'برای ارسال پیامک نیاز است - KAVENEGAR_API_KEY را تنظیم کنید' 
                    : 'Required for SMS delivery - Set KAVENEGAR_API_KEY'}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={health.kavenegar.status} />
        </div>

        {/* Last Check Time */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            {language === 'fa' ? 'آخرین بررسی: ' : 'Last checked: '}
            {new Date(health.webrtc.turn.lastChecked || '').toLocaleString(
              language === 'fa' ? 'fa-IR' : 'en-US'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
