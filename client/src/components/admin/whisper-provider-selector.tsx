import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/use-language";
import { Mic, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function WhisperProviderSelector() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState("faster-whisper");
  const [whisperUrl, setWhisperUrl] = useState("http://localhost:8000");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current Whisper provider settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  // Update Whisper provider
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whisper-health"] });
    },
  });

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.whisperProvider || "faster-whisper");
      setWhisperUrl(settings.whisperUrl || "http://localhost:8000");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        whisperProvider: selectedProvider,
        whisperUrl: selectedProvider === "faster-whisper" ? whisperUrl : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            {language === 'fa' ? 'تنظیمات سرویس رونویسی صوتی' : 'Speech-to-Text Configuration'}
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          {language === 'fa' ? 'تنظیمات سرویس رونویسی صوتی' : 'Speech-to-Text Configuration'}
        </CardTitle>
        <CardDescription>
          {language === 'fa' 
            ? 'بین Faster-Whisper (خودمیزبانی برای ایران) و OpenAI Whisper (استقرار بین‌المللی) انتخاب کنید'
            : 'Choose between Faster-Whisper (self-hosted for Iran) and OpenAI Whisper (international deployment)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {language === 'fa' ? 'فراهم‌کننده' : 'Whisper Provider'}
          </Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="faster-whisper">
                {language === 'fa' ? 'Faster-Whisper (خودمیزبانی - ایران)' : 'Faster-Whisper (Self-hosted - Iran)'}
              </SelectItem>
              <SelectItem value="openai">
                {language === 'fa' ? 'OpenAI Whisper (بین‌المللی)' : 'OpenAI Whisper (International)'}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedProvider === 'faster-whisper' 
              ? (language === 'fa' 
                  ? 'برای استقرار خودمیزبان در ایران استفاده کنید. نیاز به API Key نیست'
                  : 'Use for self-hosted deployment in Iran. No API key required.')
              : (language === 'fa'
                  ? 'برای استقرار بین‌المللی استفاده کنید. از همان OPENAI_API_KEY استفاده می‌کند'
                  : 'Use for international deployment. Uses the same OPENAI_API_KEY.')
            }
          </p>
        </div>

        {/* Faster-Whisper URL Configuration */}
        {selectedProvider === 'faster-whisper' && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">
              {language === 'fa' ? 'آدرس Faster-Whisper' : 'Faster-Whisper URL'}
            </Label>
            <Input
              value={whisperUrl}
              onChange={(e) => setWhisperUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'fa' 
                ? 'URL سرور Faster-Whisper خود را وارد کنید'
                : 'Enter your Faster-Whisper server URL'}
            </p>
          </div>
        )}

        {/* OpenAI Configuration */}
        {selectedProvider === 'openai' && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium">
                  {language === 'fa' ? 'تنظیم OpenAI API Key' : 'Setup OpenAI API Key'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'fa'
                    ? 'از همان OPENAI_API_KEY که در تنظیمات Replit تنظیم کردید استفاده می‌کند'
                    : 'Uses the same OPENAI_API_KEY configured in Replit Secrets'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || updateMutation.isPending}
          className="w-full"
        >
          {isSaving || updateMutation.isPending 
            ? (language === 'fa' ? 'در حال ذخیره...' : 'Saving...')
            : (language === 'fa' ? 'ذخیره تغییرات' : 'Save Changes')
          }
        </Button>

        {/* Status Message */}
        {updateMutation.isSuccess && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">
              {language === 'fa' ? 'تغییرات با موفقیت ذخیره شد' : 'Changes saved successfully'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {updateMutation.isError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {language === 'fa' ? 'خطا در ذخیره تغییرات' : 'Error saving changes'}
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 border rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {language === 'fa'
              ? '💡 تغییرات فراهم‌کننده رونویسی صوتی فوری اعمال می‌شوند. اپلیکیشن را دوباره شروع کنید تا تغییرات مکمل شود'
              : '💡 Changes take effect immediately. Restart the app for full effect.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
