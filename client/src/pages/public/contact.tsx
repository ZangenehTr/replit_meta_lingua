import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function Contact() {
  const { t } = useTranslation(['common']);
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/contact', { method: 'POST', body: data });
    },
    onSuccess: () => {
      toast({ 
        title: t('contact.successTitle', 'Message Sent!'), 
        description: t('contact.successMessage', 'We\'ll get back to you soon.') 
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    },
    onError: (error: any) => {
      toast({ 
        title: t('contact.errorTitle', 'Error'), 
        description: error.message || t('contact.errorMessage', 'Failed to send message'),
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
  };

  return (
    <PublicLayout>
      <SEOHead
        title={t('contact.seoTitle', 'Contact Us')}
        description={t('contact.seoDescription', 'Get in touch with Meta Lingua. We\'re here to answer your questions and help you start your language learning journey.')}
        keywords="contact, support, language learning help"
      />
      
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4" data-testid="badge-contact">{t('contact.badge', 'Contact Us')}</Badge>
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-contact">{t('contact.title', 'Get in Touch')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-contact-subtitle">
            {t('contact.subtitle', 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.')}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card data-testid="card-email">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    {t('contact.email', 'Email')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">info@metalingua.com</p>
                  <p className="text-muted-foreground">support@metalingua.com</p>
                </CardContent>
              </Card>

              <Card data-testid="card-phone">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    {t('contact.phone', 'Phone')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  <p className="text-sm text-muted-foreground">{t('contact.phoneHours', 'Mon-Fri, 9am-6pm EST')}</p>
                </CardContent>
              </Card>

              <Card data-testid="card-location">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t('contact.location', 'Location')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">123 Language Street</p>
                  <p className="text-muted-foreground">Learning City, LC 12345</p>
                  <p className="text-muted-foreground">{t('contact.country', 'United States')}</p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle data-testid="heading-send-message">{t('contact.sendMessage', 'Send us a Message')}</CardTitle>
                  <CardDescription>{t('contact.formDescription', 'Fill out the form below and we\'ll get back to you shortly')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('contact.name', 'Name')} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          data-testid="input-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('contact.emailLabel', 'Email')} *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          data-testid="input-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject', 'Subject')} *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        data-testid="input-subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('contact.message', 'Message')} *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        required
                        data-testid="textarea-message"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={contactMutation.isPending} 
                      className="w-full md:w-auto" 
                      data-testid="button-submit-contact"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {contactMutation.isPending ? t('contact.sending', 'Sending...') : t('contact.sendButton', 'Send Message')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
