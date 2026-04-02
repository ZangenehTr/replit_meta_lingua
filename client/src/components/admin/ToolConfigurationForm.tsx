import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface InstagramConfig { accessToken: string; accountHandle: string; autoPost: boolean; }
interface EmailConfig { smtpHost: string; smtpPort: string; fromEmail: string; }
interface LandingPageConfig { domain: string; template: string; rtlSupport: boolean; }
interface GeneralConfig { general: string; }

type ToolConfigMap = {
  "Instagram Integration": InstagramConfig;
  "Email Marketing": EmailConfig;
  "Landing Page Builder": LandingPageConfig;
  [key: string]: GeneralConfig;
};

type ToolConfig = InstagramConfig | EmailConfig | LandingPageConfig | GeneralConfig;

interface Props {
  toolName: string;
  onSave: (config: ToolConfig) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ToolConfigurationForm({ toolName, onSave, onCancel, isLoading }: Props) {
  const { t } = useTranslation(["admin", "common"]);

  const [instagramConfig, setInstagramConfig] = useState<InstagramConfig>({ accessToken: "", accountHandle: "", autoPost: false });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({ smtpHost: "", smtpPort: "", fromEmail: "" });
  const [landingConfig, setLandingConfig] = useState<LandingPageConfig>({ domain: "", template: "", rtlSupport: false });
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({ general: "" });

  const renderForm = () => {
    switch (toolName) {
      case "Instagram Integration":
        return (
          <div className="space-y-4">
            <div><Label htmlFor="instagramToken">{t("admin:campaigns.accessToken")}</Label><Input id="instagramToken" type="password" placeholder={t("admin:campaigns.enterAccessToken")} value={instagramConfig.accessToken} onChange={(e) => setInstagramConfig(p => ({ ...p, accessToken: e.target.value }))} /></div>
            <div><Label htmlFor="instagramAccount">{t("admin:campaigns.accountHandle")}</Label><Input id="instagramAccount" placeholder="@your_account" value={instagramConfig.accountHandle} onChange={(e) => setInstagramConfig(p => ({ ...p, accountHandle: e.target.value }))} /></div>
            <div className="flex items-center space-x-2"><Switch id="autoPost" checked={instagramConfig.autoPost} onCheckedChange={(v) => setInstagramConfig(p => ({ ...p, autoPost: v }))} /><Label htmlFor="autoPost">{t("admin:campaigns.enableAutoPosting")}</Label></div>
          </div>
        );
      case "Email Marketing":
        return (
          <div className="space-y-4">
            <div><Label htmlFor="smtpHost">{t("admin:campaigns.smtpHost")}</Label><Input id="smtpHost" placeholder="smtp.gmail.com" value={emailConfig.smtpHost} onChange={(e) => setEmailConfig(p => ({ ...p, smtpHost: e.target.value }))} /></div>
            <div><Label htmlFor="smtpPort">{t("admin:campaigns.smtpPort")}</Label><Input id="smtpPort" type="number" placeholder="587" value={emailConfig.smtpPort} onChange={(e) => setEmailConfig(p => ({ ...p, smtpPort: e.target.value }))} /></div>
            <div><Label htmlFor="emailFrom">{t("admin:campaigns.fromEmail")}</Label><Input id="emailFrom" type="email" placeholder="noreply@metalingua.com" value={emailConfig.fromEmail} onChange={(e) => setEmailConfig(p => ({ ...p, fromEmail: e.target.value }))} /></div>
          </div>
        );
      case "Landing Page Builder":
        return (
          <div className="space-y-4">
            <div><Label htmlFor="domain">{t("admin:campaigns.customDomain")}</Label><Input id="domain" placeholder="pages.metalingua.com" value={landingConfig.domain} onChange={(e) => setLandingConfig(p => ({ ...p, domain: e.target.value }))} /></div>
            <div>
              <Label htmlFor="template">{t("admin:campaigns.defaultTemplate")}</Label>
              <Select value={landingConfig.template} onValueChange={(v) => setLandingConfig(p => ({ ...p, template: v }))}>
                <SelectTrigger><SelectValue placeholder={t("admin:campaigns.selectTemplate")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">{t("admin:campaigns.modernTemplate")}</SelectItem>
                  <SelectItem value="classic">{t("admin:campaigns.classicTemplate")}</SelectItem>
                  <SelectItem value="persian">{t("admin:campaigns.persianTemplate")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2"><Switch id="rtlSupport" checked={landingConfig.rtlSupport} onCheckedChange={(v) => setLandingConfig(p => ({ ...p, rtlSupport: v }))} /><Label htmlFor="rtlSupport">{t("admin:campaigns.enableRtlSupport")}</Label></div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div><Label htmlFor="generalConfig">{t("admin:campaigns.configuration")}</Label><Textarea id="generalConfig" placeholder={t("admin:campaigns.enterConfiguration")} value={generalConfig.general} onChange={(e) => setGeneralConfig({ general: e.target.value })} rows={4} /></div>
          </div>
        );
    }
  };

  const getCurrentConfig = (): ToolConfig => {
    switch (toolName) {
      case "Instagram Integration": return instagramConfig;
      case "Email Marketing": return emailConfig;
      case "Landing Page Builder": return landingConfig;
      default: return generalConfig;
    }
  };

  return (
    <div className="space-y-6">
      {renderForm()}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>{t("common:actions.cancel")}</Button>
        <Button onClick={() => onSave(getCurrentConfig())} disabled={isLoading}>{isLoading ? t("common:actions.saving") : t("common:actions.save")}</Button>
      </div>
    </div>
  );
}
