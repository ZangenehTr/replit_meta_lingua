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
import { 
  Clock, 
  Phone, 
  PhoneCall, 
  MessageSquare,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { WORKFLOW_STATUS, LEAD_STATUS } from "@shared/schema";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

function NoResponse() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callNotes, setCallNotes] = useState("");

  // Fetch leads with no response (status could be 'contacted' with no recent response)
  const { data: noResponseLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { status: "no_response" }],
    queryFn: async () => {
      return await apiRequest(`/api/leads?workflowStatus=${WORKFLOW_STATUS.NO_RESPONSE}`);
    }
  });

  // Make call attempt mutation
  const makeCallMutation = useMutation({
    mutationFn: async ({ leadId, notes }: { leadId: number; notes: string }) => {
      return await apiRequest(`/api/leads/${leadId}/call-attempt`, {
        method: "POST",
        body: JSON.stringify({ 
          type: "call",
          content: notes,
          status: "attempted"
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "تماس ثبت شد",
        description: "تلاش تماس با موفقیت ثبت شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedLead(null);
      setCallNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ثبت تماس",
        description: error.message || "خطایی رخ داد",
        variant: "destructive",
      });
    }
  });

  // Mark as responsive mutation
  const markResponsiveMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT",
        body: JSON.stringify({ 
          workflowStatus: WORKFLOW_STATUS.FOLLOW_UP,
          status: LEAD_STATUS.CONTACTED,
          lastContactDate: new Date().toISOString()
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "وضعیت بروزرسانی شد",
        description: "متقاضی به بخش پیگیری منتقل شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  // Remove from no-response (lost lead)
  const markAsLostMutation = useMutation({
    mutationFn: async (leadId: number) => {
      return await apiRequest(`/api/leads/${leadId}`, {
        method: "PUT", 
        body: JSON.stringify({
          workflowStatus: WORKFLOW_STATUS.WITHDRAWAL,
          status: LEAD_STATUS.LOST
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "متقاضی حذف شد",
        description: "متقاضی به بخش انصراف منتقل شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    }
  });

  const filteredLeads = noResponseLeads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  const getCallCountColor = (count: number) => {
    if (count <= 2) return "bg-yellow-100 text-yellow-800";
    if (count <= 5) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در متقاضیان پاسخ ندهنده..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-no-response"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Clock className="h-4 w-4 mr-2" />
            {filteredLeads.length} مورد
          </Badge>
        </div>
      </div>

      {/* No Response Leads List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>در حال بارگذاری...</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">عالی!</h3>
              <p className="text-gray-600">در حال حاضر متقاضی پاسخ ندهنده‌ای وجود ندارد</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg" data-testid={`lead-name-${lead.id}`}>
                            {lead.firstName} {lead.lastName}
                          </h3>
                        </div>
                        
                        <Badge className={getCallCountColor(lead.callCount || 0)}>
                          {lead.callCount || 0} تماس
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{lead.phoneNumber}</span>
                        </div>
                        
                        {lead.courseTarget && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{lead.courseTarget}</span>
                          </div>
                        )}
                        
                        {lead.lastContactDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              آخرین تماس: {formatDistanceToNow(new Date(lead.lastContactDate), { 
                                addSuffix: true, 
                                locale: faIR 
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {lead.notes && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                            data-testid={`button-call-${lead.id}`}
                          >
                            <PhoneCall className="h-4 w-4 mr-2" />
                            تماس
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md" dir={isRTL ? "rtl" : "ltr"}>
                          <DialogHeader>
                            <DialogTitle>ثبت تماس</DialogTitle>
                            <DialogDescription>
                              تماس با {selectedLead?.firstName} {selectedLead?.lastName}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="call-notes">یادداشت تماس</Label>
                              <Textarea
                                id="call-notes"
                                placeholder="نتیجه تماس، توضیحات..."
                                value={callNotes}
                                onChange={(e) => setCallNotes(e.target.value)}
                                rows={3}
                                data-testid="textarea-call-notes"
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedLead(null);
                                  setCallNotes("");
                                }}
                              >
                                انصراف
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => selectedLead && makeCallMutation.mutate({
                                  leadId: selectedLead.id,
                                  notes: callNotes
                                })}
                                disabled={makeCallMutation.isPending}
                                data-testid="button-submit-call"
                              >
                                {makeCallMutation.isPending ? "در حال ثبت..." : "ثبت تماس"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markResponsiveMutation.mutate(lead.id)}
                        disabled={markResponsiveMutation.isPending}
                        data-testid={`button-responsive-${lead.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        پاسخگو
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsLostMutation.mutate(lead.id)}
                        disabled={markAsLostMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-lost-${lead.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        انصراف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {filteredLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              اقدامات سریع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                ارسال پیامک گروهی
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                فهرست تماس امروز
              </Button>
              <Button variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                گزارش عدم پاسخگویی
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NoResponse;