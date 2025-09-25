import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock,
  Send,
  CheckCircle2,
  User,
  Calendar,
  Globe2
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import apiClient from "@/lib/apiClient";

export function ContactForm() {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general',
    preferredContact: 'email',
    preferredTime: 'morning'
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  // Submit contact form mutation
  const submitContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await apiClient.post('/contact/inquiry', contactData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: t('student:messageSent'),
        description: t('student:contactSuccessMessage'),
      });
      setIsSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          inquiryType: 'general',
          preferredContact: 'email',
          preferredTime: 'morning'
        });
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.response?.data?.message || t('student:contactErrorMessage'),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContactMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card className="text-center">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t('student:messageSentSuccess')}
            </h3>
            <p className="text-gray-600">
              {t('student:contactSuccessDescription')}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('student:contactUs')}
        </h2>
        <p className="text-gray-600">
          {t('student:contactDescription')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="space-y-6">
          {/* Contact Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('student:getInTouch')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">+98 21 1234 5678</p>
                  <p className="text-sm text-gray-600">{t('student:callUs')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">info@metalingua.com</p>
                  <p className="text-sm text-gray-600">{t('student:emailUs')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('student:tehranOffice')}</p>
                  <p className="text-sm text-gray-600">{t('student:visitUs')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('student:officeHours')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('student:satToWed')}</span>
                <span className="font-medium">9:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('student:thursday')}</span>
                <span className="font-medium">9:00 - 15:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('student:friday')}</span>
                <span className="font-medium text-red-600">{t('student:closed')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('student:quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                data-testid="button-placement-test"
              >
                <Globe2 className="h-4 w-4 mr-2" />
                {t('student:takePlacementTest')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                data-testid="button-schedule-consultation"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('student:scheduleConsultation')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                data-testid="button-download-brochure"
              >
                <User className="h-4 w-4 mr-2" />
                {t('student:downloadBrochure')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('student:sendMessage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t('student:firstName')} *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                      data-testid="input-contact-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t('student:lastName')} *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                      data-testid="input-contact-last-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">{t('student:email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t('student:phone')}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      data-testid="input-contact-phone"
                    />
                  </div>
                </div>

                {/* Inquiry Details */}
                <div>
                  <Label htmlFor="inquiryType">{t('student:inquiryType')}</Label>
                  <select
                    id="inquiryType"
                    value={formData.inquiryType}
                    onChange={(e) => handleInputChange('inquiryType', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-inquiry-type"
                  >
                    <option value="general">{t('student:generalInquiry')}</option>
                    <option value="courses">{t('student:courseInformation')}</option>
                    <option value="enrollment">{t('student:enrollmentQuestions')}</option>
                    <option value="technical">{t('student:technicalSupport')}</option>
                    <option value="billing">{t('student:billingSupport')}</option>
                    <option value="other">{t('student:other')}</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="subject">{t('student:subject')} *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    placeholder={t('student:subjectPlaceholder')}
                    data-testid="input-contact-subject"
                  />
                </div>

                <div>
                  <Label htmlFor="message">{t('student:message')} *</Label>
                  <textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={t('student:messagePlaceholder')}
                    data-testid="textarea-contact-message"
                  />
                </div>

                {/* Contact Preferences */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredContact">{t('student:preferredContact')}</Label>
                    <select
                      id="preferredContact"
                      value={formData.preferredContact}
                      onChange={(e) => handleInputChange('preferredContact', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      data-testid="select-preferred-contact"
                    >
                      <option value="email">{t('student:email')}</option>
                      <option value="phone">{t('student:phone')}</option>
                      <option value="either">{t('student:either')}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">{t('student:preferredTime')}</Label>
                    <select
                      id="preferredTime"
                      value={formData.preferredTime}
                      onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      data-testid="select-preferred-time"
                    >
                      <option value="morning">{t('student:morning')}</option>
                      <option value="afternoon">{t('student:afternoon')}</option>
                      <option value="evening">{t('student:evening')}</option>
                      <option value="anytime">{t('student:anytime')}</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={submitContactMutation.isPending}
                  data-testid="button-send-message"
                >
                  {submitContactMutation.isPending ? (
                    t('common:sending')
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {t('student:sendMessage')}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}