import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Target } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isToday } from "date-fns";

interface FollowUp { id: number; type: string; customerName: string; customerPhone: string; customerEmail?: string; originalInteractionDate: string; dueDate: string; priority: "low" | "medium" | "high" | "urgent"; status: string; leadScore: number; conversionProbability: number; contactAttempts: number; maxAttempts: number; preferredContactMethod: string; }

interface Props { followUps: FollowUp[]; followUpFilter: "all" | "urgent" | "today" | "this_week"; setFollowUpFilter: (v: "all" | "urgent" | "today" | "this_week") => void; dashboardStats: { urgentFollowUps: number; }; formatDate: (d: Date | string) => string; getPriorityColor: (p: string) => string; }

export function FollowUpsView({ followUps, followUpFilter, setFollowUpFilter, dashboardStats, formatDate, getPriorityColor }: Props) {
  const { t } = useTranslation(['frontdesk']);

  const todayFollowUps = followUps.filter(f => isToday(new Date(f.dueDate))).length;
  const successRate = followUps.length > 0 ? Math.round((followUps.filter(f => f.status === "completed").length / followUps.length) * 100) : 0;
  const avgLeadScore = followUps.length > 0 ? Math.round(followUps.reduce((s, f) => s + f.leadScore, 0) / followUps.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">{t('frontdesk:views.followUpTracking')}</h2><p className="text-gray-600 dark:text-gray-400">{t('frontdesk:views.managePotentialCustomers')}</p></div>
        <Select value={followUpFilter} onValueChange={(v: "all" | "urgent" | "today" | "this_week") => setFollowUpFilter(v)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('frontdesk:common.all')}</SelectItem>
            <SelectItem value="urgent">{t('frontdesk:followUps.urgent')}</SelectItem>
            <SelectItem value="today">{t('frontdesk:followUps.today')}</SelectItem>
            <SelectItem value="this_week">{t('frontdesk:followUps.thisWeek')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {[
          [t('frontdesk:stats.urgentFollowUps'), dashboardStats.urgentFollowUps, "text-red-600"],
          [t('frontdesk:followUps.todaysFollowUps'), todayFollowUps, "text-blue-600"],
          [t('frontdesk:followUps.successRate'), `${successRate}%`, "text-green-600"],
          [t('frontdesk:followUps.avgLeadScore'), avgLeadScore, "text-purple-600"],
        ].map(([label, value, cls]) => (
          <Card key={label as string}><CardHeader className="pb-2"><CardTitle className="text-sm">{label as string}</CardTitle></CardHeader>
            <CardContent><div className={`text-2xl font-bold ${cls}`}>{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card><CardHeader><CardTitle>{t('frontdesk:followUps.followUpList')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(followUps) && followUps.map((followUp) => (
              <div key={followUp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center space-x-4">
                  <Avatar><AvatarFallback className="bg-blue-500 text-white">{followUp.customerName.charAt(0)}</AvatarFallback></Avatar>
                  <div>
                    <h4 className="font-medium">{followUp.customerName}</h4>
                    <p className="text-sm text-gray-500">{followUp.customerPhone}</p>
                    <div className="flex items-center gap-2 mt-1"><Badge className={getPriorityColor(followUp.priority)} variant="secondary">{followUp.priority}</Badge><span className="text-xs text-gray-500">{t('frontdesk:followUps.score')}: {followUp.leadScore}/100</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right"><p className="text-sm font-medium">{formatDate(followUp.dueDate)}</p><p className="text-xs text-gray-500">{t('frontdesk:followUps.attempts')}: {followUp.contactAttempts}/{followUp.maxAttempts}</p></div>
                  <Button size="sm" variant="outline"><Phone className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {followUps.length === 0 && <div className="text-center py-8 text-gray-500"><Target className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>{t('frontdesk:emptyStates.noFollowUpsAvailable')}</p></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
