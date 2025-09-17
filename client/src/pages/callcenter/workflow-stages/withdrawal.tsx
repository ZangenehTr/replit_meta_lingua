import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  XCircle, 
  Search, 
  User,
  Phone,
  Calendar,
  FileText,
  RotateCcw,
  AlertTriangle,
  TrendingDown,
  MessageSquare
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS } from "@shared/schema";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

function Withdrawal() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [withdrawalNotes, setWithdrawalNotes] = useState("");

  // Fetch withdrawn leads
  const { data: withdrawnLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { status: "withdrawal" }],
    queryFn: async () => {
      return await apiRequest(`/api/leads?workflowStatus=${WORKFLOW_STATUS.WITHDRAWAL}`);
    }
  });

  // Add withdrawal reason mutation
  const addWithdrawalReasonMutation = useMutation({
    mutationFn: async ({ leadId, reason, notes }: { leadId: number; reason: string; notes: string }) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          withdrawalReason: reason,
          notes: notes,
          withdrawalDate: new Date().toISOString()
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "دلیل انصراف ثبت شد",
        description: "دلیل انصراف با موفقیت ثبت شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
      setWithdrawalReason("");
      setWithdrawalNotes("");
    }
  });

  // Reactivate lead mutation
  const reactivateLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          status: LEAD_STATUS.CONTACTED,
          withdrawalReason: null,
          withdrawalDate: null
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "متقاضی فعال شد",
        description: "متقاضی به بخش پیگیری برگشت داده شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  const filteredLeads = withdrawnLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  // Common withdrawal reasons
  const withdrawalReasons = [
    "عدم علاقه به ادامه",
    "شرایط مالی",
    "مشکل زمانی", 
    "انتخاب موسسه دیگر",
    "عدم رضایت از خدمات",
    "تغییر شهر",
    "مشکلات شخصی",
    "عدم تطابق سطح",
    "نارضایتی از قیمت",
    "سایر دلایل"
  ];

  const getWithdrawalReasonColor = (reason: string) => {
    const colorMap: Record<string, string> = {
      "عدم علاقه به ادامه": "bg-gray-100 text-gray-800",
      "شرایط مالی": "bg-red-100 text-red-800",
      "مشکل زمانی": "bg-yellow-100 text-yellow-800",
      "انتخاب موسسه دیگر": "bg-orange-100 text-orange-800",
      "عدم رضایت از خدمات": "bg-red-100 text-red-800",
      "تغییر شهر": "bg-blue-100 text-blue-800",
      "مشکلات شخصی": "bg-purple-100 text-purple-800",
      "عدم تطابق سطح": "bg-indigo-100 text-indigo-800",
      "نارضایتی از قیمت": "bg-pink-100 text-pink-800"
    };
    return colorMap[reason] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with Search and Stats */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در متقاضیان منصرف شده..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-withdrawal"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <XCircle className="h-4 w-4 mr-2" />
            {filteredLeads.length} مورد انصراف
          </Badge>
        </div>
      </div>

      {/* Withdrawal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">کل انصراف امروز</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredLeads.filter(lead => 
                    lead.withdrawalDate && 
                    new Date(lead.withdrawalDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">بدون دلیل مشخص</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredLeads.filter(lead => !lead.withdrawalReason).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">قابل بازگردانی</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredLeads.filter(lead => 
                    lead.withdrawalReason && 
                    ['مشکل زمانی', 'مشکلات شخصی', 'تغییر شهر'].includes(lead.withdrawalReason)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawn Leads List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            متقاضیان منصرف شده
          </CardTitle>
          <CardDescription>
            لیست متقاضیانی که از ادامه فرآیند انصراف داده‌اند
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>در حال بارگذاری...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">عالی!</h3>
              <p className="text-gray-600">در حال حاضر متقاضی منصرف شده‌ای وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium" data-testid={`lead-name-${lead.id}`}>
                              {lead.firstName} {lead.lastName}
                            </h4>
                          </div>
                          
                          {lead.withdrawalReason && (
                            <Badge className={getWithdrawalReasonColor(lead.withdrawalReason)}>
                              {lead.withdrawalReason}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span dir="ltr">{lead.phoneNumber}</span>
                          </div>
                          
                          {lead.courseTarget && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3" />
                              <span>{lead.courseTarget}</span>
                            </div>
                          )}
                          
                          {lead.withdrawalDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(lead.withdrawalDate), { 
                                  addSuffix: true
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {lead.notes && (
                          <div className="mt-2">
                            <p className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              <strong>یادداشت:</strong> {lead.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {!lead.withdrawalReason && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedLead(lead)}
                                data-testid={`button-add-reason-${lead.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                ثبت دلیل
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
                              <DialogHeader>
                                <DialogTitle>ثبت دلیل انصراف</DialogTitle>
                                <DialogDescription>
                                  دلیل انصراف {selectedLead?.firstName} {selectedLead?.lastName}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="withdrawal-reason">دلیل انصراف</Label>
                                  <Select value={withdrawalReason} onValueChange={setWithdrawalReason}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="انتخاب دلیل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {withdrawalReasons.map((reason) => (
                                        <SelectItem key={reason} value={reason}>
                                          {reason}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="withdrawal-notes">توضیحات تکمیلی</Label>
                                  <Textarea
                                    id="withdrawal-notes"
                                    placeholder="توضیحات بیشتر در مورد انصراف..."
                                    value={withdrawalNotes}
                                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                                    rows={3}
                                    data-testid="textarea-withdrawal-notes"
                                  />
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedLead(null);
                                      setWithdrawalReason("");
                                      setWithdrawalNotes("");
                                    }}
                                  >
                                    انصراف
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => selectedLead && addWithdrawalReasonMutation.mutate({
                                      leadId: selectedLead.id,
                                      reason: withdrawalReason,
                                      notes: withdrawalNotes
                                    })}
                                    disabled={!withdrawalReason || addWithdrawalReasonMutation.isPending}
                                    data-testid="button-submit-withdrawal-reason"
                                  >
                                    {addWithdrawalReasonMutation.isPending ? "در حال ثبت..." : "ثبت"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reactivateLeadMutation.mutate(lead.id)}
                          disabled={reactivateLeadMutation.isPending}
                          className="text-green-600 hover:text-green-700"
                          data-testid={`button-reactivate-${lead.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          بازگردانی
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {filteredLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              اقدامات سریع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                گزارش دلایل انصراف
              </Button>
              <Button variant="outline" size="sm">
                <TrendingDown className="h-4 w-4 mr-2" />
                تحلیل روند انصراف
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                کمپین بازگردانی
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Withdrawal;