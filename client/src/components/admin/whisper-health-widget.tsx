import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { Mic, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhisperHealth {
  provider: string;
  fasterWhisper: {
    status: 'healthy' | 'unhealthy';
    url: string;
    message: string;
  };
  openai: {
    status: 'healthy' | 'unhealthy';
    message: string;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

function StatusBadge({ status }: { status: 'healthy' | 'unhealthy' | 'degraded' }) {
  const { language } = useLanguage();
  
  if (status === 'healthy') {
    return (
      <Badge variant="default" className="bg-green-500">
        {language === 'fa' ? '🟢 سالم' : '🟢 Healthy'}
      </Badge>
    );
  }
  
  if (status === 'degraded') {
    return (
      <Badge variant="default" className="bg-yellow-500">
        {language === 'fa' ? '🟡 محدود' : '🟡 Degraded'}
      </Badge>
    );
  }
  
  return (
    <Badge variant="destructive">
      {language === 'fa' ? '🔴 ناسالم' : '🔴 Unhealthy'}
    </Badge>
  );
}

export function WhisperHealthWidget() {
  const { language } = useLanguage();
  
  const { data: health, isLoading, refetch } = useQuery<WhisperHealth>({
    queryKey: ["/api/admin/whisper-health"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت سرویس رونویسی صوتی' : 'Whisper Service Status'}
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
            <Mic className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت سرویس رونویسی صوتی' : 'Whisper Service Status'}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Provider Badge */}
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <p className="text-sm font-medium">
            {language === 'fa' ? 'فراهم‌کننده فعال' : 'Active Provider'}
          </p>
          <Badge variant="outline">
            {health.provider === 'faster-whisper' 
              ? (language === 'fa' ? 'Faster-Whisper' : 'Faster-Whisper')
              : (language === 'fa' ? 'OpenAI Whisper' : 'OpenAI Whisper')
            }
          </Badge>
        </div>

        {/* Faster-Whisper Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <p className="font-medium">
              {language === 'fa' ? 'Faster-Whisper (خودمیزبانی)' : 'Faster-Whisper (Self-hosted)'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{health.fasterWhisper.url}</p>
            <p className="text-xs text-muted-foreground">{health.fasterWhisper.message}</p>
          </div>
          <StatusBadge status={health.fasterWhisper.status} />
        </div>

        {/* OpenAI Whisper Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex-1">
            <p className="font-medium">
              {language === 'fa' ? 'OpenAI Whisper (بین‌المللی)' : 'OpenAI Whisper (International)'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{health.openai.message}</p>
          </div>
          <StatusBadge status={health.openai.status} />
        </div>

        {/* Overall Status */}
        <div className="p-3 rounded-lg bg-muted">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              {language === 'fa' ? 'حالت کلی' : 'Overall Status'}
            </p>
            <StatusBadge status={health.overall} />
          </div>
          <p className="text-xs text-muted-foreground">
            {health.overall === 'healthy' 
              ? (language === 'fa' ? 'همه سیستم‌ها عملیاتی هستند' : 'All systems operational')
              : health.overall === 'degraded'
                ? (language === 'fa' ? 'برخی سرویس‌ها در دسترس نیستند' : 'Some services unavailable')
                : (language === 'fa' ? 'هیچ سرویسی در دسترس نیست' : 'No services available')
            }
          </p>
        </div>

        {/* Last Checked */}
        <p className="text-xs text-muted-foreground text-center">
          {language === 'fa' ? 'آخرین بررسی:' : 'Last checked:'} {new Date().toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
