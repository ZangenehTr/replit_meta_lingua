import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Search, 
  UserPlus, 
  Edit, 
  Eye,
  PhoneCall,
  Mail,
  MessageSquare,
  Clock,
  User,
  Calendar,
  History
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Lead } from "@shared/schema";
import { motion } from "framer-motion";

function ContactDesk() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedContact, setSelectedContact] = useState<Lead | null>(null);

  // Fetch contacts based on phone search
  const { data: contacts = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads", searchPhone],
    enabled: searchPhone.length >= 3
  });

  // Auto-fill mutation to find existing contact by phone
  const autoFillMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiRequest(`/api/leads/search-by-phone`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber })
      });
      return response;
    },
    onSuccess: (contact: Lead) => {
      if (contact) {
        setSelectedContact(contact);
        toast({
          title: "جستجو موفق",
          description: `اطلاعات ${contact.firstName} ${contact.lastName} یافت شد`,
        });
      } else {
        toast({
          title: "اطلاعات یافت نشد",
          description: "این شماره تلفن در سیستم موجود نیست",
          variant: "destructive",
        });
      }
    }
  });

  const handlePhoneSearch = () => {
    if (searchPhone.length >= 10) {
      autoFillMutation.mutate(searchPhone);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePhoneSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800', 
      'interested': 'bg-green-100 text-green-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'converted': 'bg-emerald-100 text-emerald-800',
      'lost': 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Phone Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            جستجوی شماره تلفن
          </CardTitle>
          <CardDescription>
            شماره تلفن متقاضی را وارد کنید تا اطلاعات قبلی نمایش داده شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="phone-search">شماره تلفن</Label>
              <Input
                id="phone-search"
                type="tel"
                placeholder="09123456789"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyPress={handleKeyPress}
                dir="ltr"
                className="text-left"
                data-testid="input-phone-search"
              />
            </div>
            <Button 
              onClick={handlePhoneSearch}
              disabled={searchPhone.length < 10 || autoFillMutation.isPending}
              className="mt-6"
              data-testid="button-search-phone"
            >
              <Search className="h-4 w-4 mr-2" />
              جستجو
            </Button>
          </div>

          {autoFillMutation.isPending && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">در حال جستجو...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information Display */}
      {selectedContact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات متقاضی
                </div>
                <Badge 
                  className={getStatusBadge(selectedContact.status)}
                  data-testid="badge-contact-status"
                >
                  {selectedContact.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">نام و نام خانوادگی</Label>
                  <p className="text-lg font-medium" data-testid="text-contact-name">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">شماره تلفن</Label>
                  <p className="text-lg font-medium" dir="ltr" data-testid="text-contact-phone">
                    {selectedContact.phoneNumber}
                  </p>
                </div>
                
                {selectedContact.email && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">ایمیل</Label>
                    <p className="text-lg font-medium" dir="ltr" data-testid="text-contact-email">
                      {selectedContact.email}
                    </p>
                  </div>
                )}
                
                {selectedContact.interestedLanguage && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">زبان مورد علاقه</Label>
                    <p className="text-lg font-medium">
                      {selectedContact.interestedLanguage}
                    </p>
                  </div>
                )}
                
                {selectedContact.interestedLevel && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">سطح مورد علاقه</Label>
                    <p className="text-lg font-medium">
                      {selectedContact.interestedLevel}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">منبع</Label>
                  <p className="text-lg font-medium">
                    {selectedContact.source}
                  </p>
                </div>
              </div>

              {selectedContact.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">یادداشت‌ها</Label>
                  <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1">
                    {selectedContact.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button variant="outline" size="sm" data-testid="button-call-contact">
                  <PhoneCall className="h-4 w-4 mr-2" />
                  تماس تلفنی
                </Button>
                
                {selectedContact.email && (
                  <Button variant="outline" size="sm" data-testid="button-email-contact">
                    <Mail className="h-4 w-4 mr-2" />
                    ارسال ایمیل
                  </Button>
                )}
                
                <Button variant="outline" size="sm" data-testid="button-sms-contact">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  ارسال پیامک
                </Button>
                
                <Button variant="outline" size="sm" data-testid="button-edit-contact">
                  <Edit className="h-4 w-4 mr-2" />
                  ویرایش اطلاعات
                </Button>
                
                <Button variant="outline" size="sm" data-testid="button-history-contact">
                  <History className="h-4 w-4 mr-2" />
                  تاریخچه تماس‌ها
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Contact List */}
      {contacts.length > 0 && !selectedContact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              نتایج جستجو ({contacts.length} مورد)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contacts.slice(0, 5).map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedContact(contact)}
                  data-testid={`contact-item-${contact.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600" dir="ltr">
                      {contact.phoneNumber}
                    </p>
                  </div>
                  <Badge className={getStatusBadge(contact.status)}>
                    {contact.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Contact Button */}
      <div className="flex justify-center">
        <Button size="lg" data-testid="button-new-contact">
          <UserPlus className="h-5 w-5 mr-2" />
          ثبت متقاضی جدید
        </Button>
      </div>
    </div>
  );
}

export default ContactDesk;