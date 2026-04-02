import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Eye, Upload, Send, Phone } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
}

interface SMSSendProgress {
  sent: number;
  failed: number;
  total: number;
}

interface Props {
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;
  onSelectCampaign: (c: Campaign | null) => void;
  audienceSegment: string;
  onAudienceSegmentChange: (s: string) => void;
  inactiveMonths: number;
  onInactiveMonthsChange: (n: number) => void;
  audienceCount: number;
  audiencePreviewLoading: boolean;
  onPreviewAudience: () => void;
  csvContent: string;
  onCsvContentChange: (v: string) => void;
  csvParseLoading: boolean;
  onParseCSV: (format: "csv" | "text") => void;
  csvParseResult: { validCount: number; invalidCount: number } | null;
  smsMessage: string;
  onSmsMessageChange: (v: string) => void;
  discountCode: string;
  onDiscountCodeChange: (v: string) => void;
  testPhone: string;
  onTestPhoneChange: (v: string) => void;
  testSMSLoading: boolean;
  onSendTestSMS: () => void;
  bulkSMSLoading: boolean;
  onSendBulkSMS: () => void;
  smsSendProgress: SMSSendProgress | null;
}

export function SMSCampaignTab({
  campaigns, selectedCampaign, onSelectCampaign, audienceSegment, onAudienceSegmentChange,
  inactiveMonths, onInactiveMonthsChange, audienceCount, audiencePreviewLoading, onPreviewAudience,
  csvContent, onCsvContentChange, csvParseLoading, onParseCSV, csvParseResult,
  smsMessage, onSmsMessageChange, discountCode, onDiscountCodeChange, testPhone, onTestPhoneChange,
  testSMSLoading, onSendTestSMS, bulkSMSLoading, onSendBulkSMS, smsSendProgress,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Bulk SMS Campaigns</CardTitle>
        <CardDescription>Send targeted SMS campaigns to students with discount codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Select Campaign (Optional)</Label>
          <Select value={selectedCampaign?.id?.toString() || ""} onValueChange={(v) => onSelectCampaign(campaigns.find((c) => c.id === parseInt(v)) || null)}>
            <SelectTrigger data-testid="select-campaign"><SelectValue placeholder="Select a campaign to track SMS metrics" /></SelectTrigger>
            <SelectContent>{campaigns.filter((c) => c.status !== "completed").map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.type})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Select value={audienceSegment} onValueChange={onAudienceSegmentChange}>
            <SelectTrigger data-testid="select-audience"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid_placement_test">Unpaid Placement Test Takers (Last 7 Days)</SelectItem>
              <SelectItem value="inactive_students">Inactive Students (No Activity)</SelectItem>
              <SelectItem value="current_students">Current Enrolled Students</SelectItem>
              <SelectItem value="custom_csv">Custom List (CSV Upload)</SelectItem>
            </SelectContent>
          </Select>
          {audienceSegment === "inactive_students" && (
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm">Inactive for (months):</Label>
              <Input type="number" min="1" max="24" value={inactiveMonths} onChange={(e) => onInactiveMonthsChange(parseInt(e.target.value) || 3)} className="w-20" data-testid="input-inactive-months" />
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onPreviewAudience} disabled={audiencePreviewLoading} data-testid="button-preview-audience" className="mt-2">
            <Eye className="h-4 w-4 me-2" />Preview Audience ({audienceCount || 0} recipients)
          </Button>
        </div>
        {audienceSegment === "custom_csv" && (
          <Card className="bg-muted/50">
            <CardHeader><CardTitle className="text-sm">Upload Phone Numbers</CardTitle><CardDescription className="text-xs">Upload CSV or paste phone numbers (one per line)</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Paste phone numbers here..." value={csvContent} onChange={(e) => onCsvContentChange(e.target.value)} rows={8} className="font-mono text-sm" data-testid="textarea-csv-content" />
              <div className="flex gap-2">
                <Button onClick={() => onParseCSV("csv")} disabled={!csvContent.trim() || csvParseLoading} size="sm" data-testid="button-parse-csv"><Upload className="h-4 w-4 me-2" />Parse CSV</Button>
                <Button onClick={() => onParseCSV("text")} disabled={!csvContent.trim() || csvParseLoading} size="sm" variant="outline" data-testid="button-parse-text">Parse as Text</Button>
              </div>
              {csvParseResult && (
                <div className="flex gap-4 text-sm">
                  <Badge className="bg-green-100 text-green-800">Valid: {csvParseResult.validCount}</Badge>
                  {csvParseResult.invalidCount > 0 && <Badge className="bg-red-100 text-red-800">Invalid: {csvParseResult.invalidCount}</Badge>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label>Message Template</Label><span className="text-xs text-muted-foreground">{smsMessage.length} / 160 characters</span></div>
          <Textarea placeholder="Enter your message. Use: {studentName}, {discountCode}, {validUntil}" value={smsMessage} onChange={(e) => onSmsMessageChange(e.target.value)} rows={6} data-testid="textarea-sms-message" />
          <div className="flex flex-wrap gap-2">
            {["{studentName}", "{discountCode}", "{validUntil}"].map((v) => <Button key={v} size="sm" variant="outline" onClick={() => onSmsMessageChange(smsMessage + v)}>+ {v.replace("{", "").replace("}", "")}</Button>)}
          </div>
          <Card className="bg-muted/30"><CardHeader className="pb-3"><CardTitle className="text-xs text-muted-foreground">Preview</CardTitle></CardHeader><CardContent className="text-sm">{smsMessage.replace("{studentName}", "علی رضایی").replace("{discountCode}", "SPRING2025").replace("{validUntil}", "1404/01/15")}</CardContent></Card>
        </div>
        <div className="space-y-2">
          <Label>Discount Code (Optional)</Label>
          <Input placeholder="e.g., SPRING2025" value={discountCode} onChange={(e) => onDiscountCodeChange(e.target.value)} data-testid="input-discount-code" />
        </div>
        <Card className="bg-blue-50">
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4" />Test SMS Before Sending</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Test phone number (e.g., 09123456789)" value={testPhone} onChange={(e) => onTestPhoneChange(e.target.value)} data-testid="input-test-phone" />
              <Button onClick={onSendTestSMS} disabled={!testPhone || !smsMessage.trim() || testSMSLoading} data-testid="button-send-test"><Send className="h-4 w-4 me-2" />Send Test</Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between pt-4 border-t">
          <div><p className="text-sm font-medium">Ready to send to {audienceCount || 0} recipients</p><p className="text-xs text-muted-foreground">Estimated cost: {(audienceCount || 0) * 50} IRR</p></div>
          <Button size="lg" onClick={onSendBulkSMS} disabled={!smsMessage.trim() || audienceCount === 0 || bulkSMSLoading} data-testid="button-send-bulk"><Send className="h-4 w-4 me-2" />Send Bulk SMS</Button>
        </div>
        {smsSendProgress && (
          <Card className="bg-green-50">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Sending Progress</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(smsSendProgress.sent / smsSendProgress.total) * 100} />
              <div className="flex justify-between text-sm"><span>Sent: {smsSendProgress.sent}</span><span>Failed: {smsSendProgress.failed}</span><span>Total: {smsSendProgress.total}</span></div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
