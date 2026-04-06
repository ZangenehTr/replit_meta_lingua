import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  User,
  Phone,
  Calendar,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Award
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";
import { LEAD_WORKFLOW_STAGE } from "@shared/schema";
import { motion } from "framer-motion";

function CompletedPrivateClass() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads/by-stage/completed_private_class"],
    queryFn: async () => {
      return await apiRequest(`/api/leads/by-stage/completed_private_class`);
    }
  });

  const filteredLeads = leads.filter(lead =>
    lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t('callcenter:stages.completed_private_class.search_placeholder', 'جستجو در دانش‌آموزان فارغ‌التحصیل...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <GraduationCap className="h-4 w-4 me-2" />
            {filteredLeads.length} {t('callcenter:stages.completed_private_class.count', 'مورد')}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>{t('callcenter:stages.completed_private_class.loading', 'در حال بارگذاری...')}</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('callcenter:stages.completed_private_class.empty_title', 'هنوز موردی نیست')}</h3>
              <p className="text-gray-600">{t('callcenter:stages.completed_private_class.empty_desc', 'در حال حاضر دانش‌آموز فارغ‌التحصیلی وجود ندارد')}</p>
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
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <h3 className="font-semibold text-lg">
                          {lead.firstName} {lead.lastName}
                        </h3>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 me-1" />
                          {t('callcenter:stages.completed_private_class.badge', 'تکمیل شده')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span dir="ltr">{lead.phoneNumber}</span>
                        </div>
                        {lead.courseTarget && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{lead.courseTarget}</span>
                          </div>
                        )}
                        {lead.updatedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{t('callcenter:stages.completed_private_class.completion_date', 'تاریخ تکمیل')}: {new Date(lead.updatedAt).toLocaleDateString('fa-IR')}</span>
                          </div>
                        )}
                        {(lead as any).totalSessions && (
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span>{t('callcenter:stages.completed_private_class.total_sessions', 'تعداد جلسات')}: {(lead as any).totalSessions}</span>
                          </div>
                        )}
                        {(lead as any).assignedTeacher && (
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>{t('callcenter:stages.completed_private_class.teacher', 'استاد')}: {(lead as any).assignedTeacher}</span>
                          </div>
                        )}
                      </div>

                      {lead.notes && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default CompletedPrivateClass;
