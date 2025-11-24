import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { Bot, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIHealth {
  primary: {
    name: string;
    status: 'healthy' | 'unhealthy';
  };
  fallback: {
    name: string;
    status: 'healthy' | 'unhealthy';
  } | null;
  hasHealthyProvider: boolean;
  lastChecked: string;
}

function StatusBadge({ status }: { status: 'healthy' | 'unhealthy' }) {
  const { language } = useLanguage();
  
  if (status === 'healthy') {
    return (
      <Badge variant="default" className="bg-green-500">
        {language === 'fa' ? '🟢 سالم' : '🟢 Healthy'}
      </Badge>
    );
  }
  
  return (
    <Badge variant="destructive">
      {language === 'fa' ? '🔴 ناسالم' : '🔴 Unhealthy'}
    </Badge>
  );
}

export function AIHealthWidget() {
  const { language } = useLanguage();
  
  const { data: health, isLoading, refetch } = useQuery<AIHealth>({
    queryKey: ["/api/admin/ai-health"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت هوش مصنوعی' : 'AI Provider Status'}
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
            <Bot className="h-5 w-5" />
            {language === 'fa' ? 'وضعیت هوش مصنوعی' : 'AI Provider Status'}
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
        {/* Primary Provider */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">
              {language === 'fa' ? 'فراهم‌کننده اولیه' : 'Primary Provider'}
            </p>
            <p className="text-sm text-muted-foreground">{health.primary.name}</p>
          </div>
          <StatusBadge status={health.primary.status} />
        </div>

        {/* Fallback Provider */}
        {health.fallback && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">
                {language === 'fa' ? 'فراهم‌کننده پشتیبان' : 'Fallback Provider'}
              </p>
              <p className="text-sm text-muted-foreground">{health.fallback.name}</p>
            </div>
            <StatusBadge status={health.fallback.status} />
          </div>
        )}

        {/* Overall Status */}
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-sm font-medium">
            {language === 'fa' ? 'حالت کلی' : 'Overall Status'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {health.hasHealthyProvider 
              ? (language === 'fa' ? 'حداقل یک فراهم‌کننده فعال است' : 'At least one provider is healthy')
              : (language === 'fa' ? 'هیچ فراهم‌کننده‌ای فعال نیست' : 'No healthy providers available')
            }
          </p>
        </div>

        {/* Last Checked */}
        <p className="text-xs text-muted-foreground text-center">
          {language === 'fa' ? 'آخرین بررسی:' : 'Last checked:'} {new Date(health.lastChecked).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
}
