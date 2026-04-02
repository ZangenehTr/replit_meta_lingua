import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

const CHANNELS = ["Instagram", "Telegram", "YouTube", "LinkedIn", "Email", "Google Ads"];

interface CampaignData {
  name: string;
  type: string;
  targetAudience: string;
  budget: number;
  channels: string[];
  startDate: string;
  endDate: string;
  description: string;
}

interface Props {
  campaignData: CampaignData;
  onDataChange: (data: CampaignData) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function NewCampaignForm({ campaignData, onDataChange, onSave, onCancel, isLoading }: Props) {
  const { t } = useTranslation(["admin", "common"]);
  const update = (field: keyof CampaignData, value: string | number | boolean | string[]) => onDataChange({ ...campaignData, [field]: value });
  const toggleChannel = (ch: string) => {
    const channels = campaignData.channels.includes(ch) ? campaignData.channels.filter((c) => c !== ch) : [...campaignData.channels, ch];
    update("channels", channels);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="campaignName">{t("admin:campaigns.campaignName")} *</Label>
          <Input id="campaignName" placeholder={t("admin:campaigns.enterCampaignName")} value={campaignData.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="campaignType">{t("admin:campaigns.campaignType")}</Label>
          <Select value={campaignData.type} onValueChange={(v) => update("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="enrollment">{t("admin:campaigns.campaignTypes.enrollment")}</SelectItem>
              <SelectItem value="retention">{t("admin:campaigns.campaignTypes.retention")}</SelectItem>
              <SelectItem value="referral">{t("admin:campaigns.campaignTypes.referral")}</SelectItem>
              <SelectItem value="awareness">{t("admin:campaigns.campaignTypes.awareness")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("admin:campaigns.description")}</Label>
        <Textarea id="description" placeholder={t("admin:campaigns.enterDescription")} value={campaignData.description} onChange={(e) => update("description", e.target.value)} rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">{t("admin:campaigns.budget")} (IRR)</Label>
          <Input id="budget" type="number" placeholder="10,000,000" value={campaignData.budget} onChange={(e) => update("budget", parseInt(e.target.value) || 0)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetAudience">{t("admin:campaigns.targetAudience")}</Label>
          <Select value={campaignData.targetAudience} onValueChange={(v) => update("targetAudience", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="persian_learners">{t("admin:campaigns.persianLearners")}</SelectItem>
              <SelectItem value="new_students">{t("admin:campaigns.newStudents")}</SelectItem>
              <SelectItem value="existing_students">{t("admin:campaigns.existingStudents")}</SelectItem>
              <SelectItem value="all_users">{t("admin:campaigns.allUsers")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">{t("admin:campaigns.startDate")}</Label>
          <Input id="startDate" type="date" value={campaignData.startDate} onChange={(e) => update("startDate", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">{t("admin:campaigns.endDate")}</Label>
          <Input id="endDate" type="date" value={campaignData.endDate} onChange={(e) => update("endDate", e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("admin:campaigns.marketingChannels")} *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CHANNELS.map((ch) => (
            <div key={ch} className="flex items-center space-x-2">
              <Switch id={ch} checked={campaignData.channels.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
              <Label htmlFor={ch} className="text-sm">{ch}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>{t("common:actions.cancel")}</Button>
        <Button onClick={onSave} disabled={isLoading}>{isLoading ? t("common:actions.creating") : t("admin:campaigns.createCampaign")}</Button>
      </div>
    </div>
  );
}
