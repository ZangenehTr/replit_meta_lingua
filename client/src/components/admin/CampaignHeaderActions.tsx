import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Mail, MessageSquare, Bot, Plus, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampaignHeaderMutations } from "@/hooks/useCampaigns";

interface Props {
  onNewCampaign: () => void;
}

export function CampaignHeaderActions({ onNewCampaign }: Props) {
  const { t } = useTranslation(["admin", "common"]);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [emailContent, setEmailContent] = useState("");
  const [telegramContent, setTelegramContent] = useState("");
  const [aiResponse, setAIResponse] = useState("");

  const { sendEmailMutation, telegramMutation, aiAssistantMutation } = useCampaignHeaderMutations(
    () => { setShowEmailDialog(false); setEmailContent(""); },
    () => { setShowTelegramDialog(false); setTelegramContent(""); },
    (response) => setAIResponse(response),
  );

  return (
    <div className="flex gap-2 flex-wrap">
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <Button variant="outline" onClick={() => setShowEmailDialog(true)}><Mail className="h-4 w-4 me-2" />{t("admin:campaigns.emailBroadcast")}</Button>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin:campaigns.sendEmailToAllStudents")}</DialogTitle><DialogDescription>{t("admin:campaigns.broadcastEmailDesc")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin:campaigns.emailContent")}</Label><Textarea placeholder={t("admin:campaigns.emailPlaceholder")} value={emailContent} onChange={(e) => setEmailContent(e.target.value)} rows={5} /></div>
            <div className="flex gap-2">
              <Button onClick={() => sendEmailMutation.mutate({ recipients: ["all_students"], subject: "Important Update from MetaLingo", content: emailContent })} disabled={sendEmailMutation.isPending}><Send className="h-4 w-4 me-2" />{sendEmailMutation.isPending ? t("admin:campaigns.sending") : t("admin:campaigns.sendEmail")}</Button>
              <Button variant="outline" onClick={() => setShowEmailDialog(false)}>{t("admin:campaigns.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTelegramDialog} onOpenChange={setShowTelegramDialog}>
        <Button variant="outline" onClick={() => setShowTelegramDialog(true)}><MessageSquare className="h-4 w-4 me-2" />{t("admin:campaigns.telegramAutomation")}</Button>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin:campaigns.telegramChannelAutomation")}</DialogTitle><DialogDescription>{t("admin:campaigns.setupTelegramDesc")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("admin:campaigns.telegramMessage")}</Label><Textarea placeholder={t("admin:campaigns.telegramPlaceholder")} value={telegramContent} onChange={(e) => setTelegramContent(e.target.value)} rows={5} /></div>
            <div className="flex items-center space-x-2"><Switch defaultChecked /><Label>{t("admin:campaigns.enableAutoReply")}</Label></div>
            <div className="flex gap-2">
              <Button onClick={() => telegramMutation.mutate({ channelId: "@metalingua_channel", message: telegramContent, autoReply: true })} disabled={telegramMutation.isPending}><Send className="h-4 w-4 me-2" />{telegramMutation.isPending ? t("admin:campaigns.sending") : t("admin:campaigns.configure")}</Button>
              <Button variant="outline" onClick={() => setShowTelegramDialog(false)}>{t("admin:campaigns.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <Button variant="outline" onClick={() => setShowAIDialog(true)}><Bot className="h-4 w-4 me-2" />{t("admin:campaigns.aiAssistant")}</Button>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin:campaigns.fineTunedAiAssistant")}</DialogTitle><DialogDescription>{t("admin:campaigns.askAiForHelp")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>{t("common:form.question")}</Label><Input id="aiQuery" placeholder={t("admin:campaigns.aiQueryPlaceholder")} onKeyDown={(e) => { if (e.key === "Enter") aiAssistantMutation.mutate(e.currentTarget.value); }} /></div>
            {aiResponse && <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm">{aiResponse}</p></div>}
            <div className="flex gap-2">
              <Button onClick={() => { const el = document.getElementById("aiQuery") as HTMLInputElement; if (el?.value) aiAssistantMutation.mutate(el.value); }} disabled={aiAssistantMutation.isPending}><Bot className="h-4 w-4 me-2" />{aiAssistantMutation.isPending ? t("admin:campaigns.asking") : t("admin:campaigns.askAi")}</Button>
              <Button variant="outline" onClick={() => setShowAIDialog(false)}>{t("common:actions.close")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={onNewCampaign} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"><Plus className="h-4 w-4 me-2" />{t("admin:campaigns.newCampaign")}</Button>
    </div>
  );
}
