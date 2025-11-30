import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, UserPlus, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import {
  PhoneSearchInput,
  LeadCard,
  LeadSearchResults,
  normalizeLeadToSummary,
  normalizeLeadsToSummaries,
  type LeadSummary,
} from "@/components/shared/callcenter";

interface ContactDeskProps {
  onNavigateToNewIntake?: () => void;
}

function ContactDesk({ onNavigateToNewIntake }: ContactDeskProps) {
  const { t } = useTranslation(["callcenter", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<LeadSummary | null>(null);

  const { data: contacts = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads", { phone: searchPhone }],
    queryFn: async () => {
      if (searchPhone.length < 3) return [];
      return apiRequest(`/api/leads?phone=${encodeURIComponent(searchPhone)}`);
    },
    enabled: searchPhone.length >= 3,
  });

  const autoFillMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest(`/api/leads/search-by-phone`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });
      return response;
    },
    onSuccess: (contact: Lead) => {
      if (contact) {
        setSelectedContact(normalizeLeadToSummary(contact));
        toast({
          title: t("callcenter:searchSuccess", "جستجو موفق"),
          description: `${t("callcenter:infoFound", "اطلاعات")} ${contact.firstName} ${contact.lastName} ${t("callcenter:found", "یافت شد")}`,
        });
      } else {
        toast({
          title: t("callcenter:notFound", "اطلاعات یافت نشد"),
          description: t("callcenter:phoneNotInSystem", "این شماره تلفن در سیستم موجود نیست"),
          variant: "destructive",
        });
      }
    },
  });

  const handlePhoneSearch = useCallback(() => {
    if (searchPhone.length >= 10) {
      autoFillMutation.mutate(searchPhone);
    }
  }, [searchPhone, autoFillMutation]);

  const handleSelectContact = useCallback((lead: LeadSummary) => {
    setSelectedContact(lead);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedContact(null);
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setSearchPhone(value);
    if (selectedContact && value !== selectedContact.phoneNumber) {
      setSelectedContact(null);
    }
  }, [selectedContact]);

  const handleCall = useCallback(() => {
    if (selectedContact) {
      window.location.href = `tel:${selectedContact.phoneNumber}`;
    }
  }, [selectedContact]);

  const handleSms = useCallback(() => {
    if (selectedContact) {
      window.location.href = `sms:${selectedContact.phoneNumber}`;
    }
  }, [selectedContact]);

  const handleEmail = useCallback(() => {
    if (selectedContact?.email) {
      window.location.href = `mailto:${selectedContact.email}`;
    }
  }, [selectedContact]);

  const handleEdit = useCallback(() => {
    toast({
      title: t("callcenter:editMode", "حالت ویرایش"),
      description: t("callcenter:editModeDescription", "ویرایش اطلاعات در حال توسعه است"),
    });
  }, [toast, t]);

  const handleViewHistory = useCallback(() => {
    toast({
      title: t("callcenter:callHistory", "تاریخچه تماس‌ها"),
      description: t("callcenter:historyDescription", "نمایش تاریخچه در حال توسعه است"),
    });
  }, [toast, t]);

  const contactSummaries = normalizeLeadsToSummaries(contacts);

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            {t("callcenter:phoneSearch", "جستجوی شماره تلفن")}
          </CardTitle>
          <CardDescription>
            {t("callcenter:phoneSearchDescription", "شماره تلفن متقاضی را وارد کنید تا اطلاعات قبلی نمایش داده شود")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhoneSearchInput
            value={searchPhone}
            onChange={handlePhoneChange}
            onSearch={handlePhoneSearch}
            isLoading={autoFillMutation.isPending}
            label={t("callcenter:phoneNumber", "شماره تلفن")}
            placeholder="09123456789"
            minLength={10}
          />
        </CardContent>
      </Card>

      {selectedContact && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t("callcenter:backToSearch", "بازگشت به جستجو")}
          </Button>
          <LeadCard
            lead={selectedContact}
            title={t("callcenter:contactInfo", "اطلاعات متقاضی")}
            onCall={handleCall}
            onSms={handleSms}
            onEmail={handleEmail}
            onEdit={handleEdit}
            onViewHistory={handleViewHistory}
          />
        </div>
      )}

      {contactSummaries.length > 0 && !selectedContact && (
        <LeadSearchResults
          leads={contactSummaries}
          onSelect={handleSelectContact}
          maxResults={5}
          title={t("callcenter:searchResults", "نتایج جستجو")}
        />
      )}

      <div className="flex justify-center">
        <Button size="lg" onClick={onNavigateToNewIntake} data-testid="button-new-contact">
          <UserPlus className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
          {t("callcenter:registerNewContact", "ثبت متقاضی جدید")}
        </Button>
      </div>
    </div>
  );
}

export default ContactDesk;
