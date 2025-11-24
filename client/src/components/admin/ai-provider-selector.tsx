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
import { Bot, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export function AIProviderSelector() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current AI provider settings
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

  // Update AI provider
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-health"] });
    },
  });

  // Initialize from settings
  useEffect(() => {
    if (settings) {
      setSelectedProvider(settings.aiProvider || "ollama");
      setOllamaUrl(settings.aiOllamaUrl || "http://localhost:11434");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        aiProvider: selectedProvider,
        aiOllamaUrl: selectedProvider === "ollama" ? ollamaUrl : null,
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
            <Bot className="h-5 w-5" />
            {language === 'fa' ? 'انتخاب فراهم‌کننده هوش مصنوعی' : 'AI Provider Configuration'}
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
          <Bot className="h-5 w-5" />
          {language === 'fa' ? 'انتخاب فراهم‌کننده هوش مصنوعی' : 'AI Provider Configuration'}
        </CardTitle>
        <CardDescription>
          {language === 'fa' 
            ? 'بین Ollama (خودمیزبانی برای ایران) و OpenAI (استقرار بین‌المللی) انتخاب کنید'
            : 'Choose between Ollama (self-hosted for Iran) and OpenAI (international deployment)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {language === 'fa' ? 'فراهم‌کننده' : 'AI Provider'}
          </Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ollama">
                {language === 'fa' ? 'Ollama (خودمیزبانی - ایران)' : 'Ollama (Self-hosted - Iran)'}
              </SelectItem>
              <SelectItem value="openai">
                {language === 'fa' ? 'OpenAI (بین‌المللی)' : 'OpenAI (International)'}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedProvider === 'ollama' 
              ? (language === 'fa' 
                  ? 'برای استقرار خودمیزبان در ایران استفاده کنید. نیاز به API Key نیست'
                  : 'Use for self-hosted deployment in Iran. No API key required.')
              : (language === 'fa'
                  ? 'برای استقرار بین‌المللی استفاده کنید. نیاز به OPENAI_API_KEY دارد'
                  : 'Use for international deployment. Requires OPENAI_API_KEY.')
            }
          </p>
        </div>

        {/* Ollama URL Configuration */}
        {selectedProvider === 'ollama' && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm font-medium">
              {language === 'fa' ? 'آدرس Ollama' : 'Ollama URL'}
            </Label>
            <Input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="http://localhost:11434"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'fa' 
                ? 'URL سرور Ollama خود را وارد کنید'
                : 'Enter your Ollama server URL'}
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
                    ? 'بروید به تنظیمات Replit > Secrets و OPENAI_API_KEY را اضافه کنید'
                    : 'Go to Replit Secrets and add your OPENAI_API_KEY'}
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
              ? '💡 تغییرات فراهم‌کننده هوش مصنوعی فوری اعمال می‌شوند. اپلیکیشن را دوباره شروع کنید تا تغییرات مکمل شود'
              : '💡 Changes take effect immediately. Restart the app for full effect.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
