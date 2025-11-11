import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Schema for phone step
const phoneSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  phoneNumber: z.string().regex(/^0?9[0-9]{9}$/, 'Invalid Iranian phone number')
});

// Schema for verification step
const verifySchema = z.object({
  otpCode: z.string().length(6, 'Code must be 6 digits').regex(/^[0-9]+$/, 'Code must contain only numbers')
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

interface OTPConversionProps {
  leadId?: number;
  phoneNumber?: string;
  onSuccess?: (user: any) => void;
}

export default function OTPConversion({ leadId, phoneNumber, onSuccess }: OTPConversionProps) {
  const { t } = useTranslation(['auth']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [storedData, setStoredData] = useState({ leadId: '', phoneNumber: '' });
  
  // Form for phone step
  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      leadId: leadId?.toString() || '',
      phoneNumber: phoneNumber || ''
    }
  });
  
  // Form for verification step
  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      otpCode: ''
    }
  });
  
  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Send OTP
  const handleSendOTP = async (data: PhoneFormData) => {
    setError('');
    setLoading(true);
    
    try {
      const response = await apiRequest('/api/prospect-lifecycle/send-otp', {
        method: 'POST',
        body: {
          leadId: Number(data.leadId),
          phoneNumber: data.phoneNumber
        }
      });
      
      if (response.success) {
        setStoredData({ leadId: data.leadId, phoneNumber: data.phoneNumber });
        setOtpSent(true);
        setStep('verify');
        startResendTimer();
        toast({
          title: t('auth:otp.verificationCodeSent'),
          description: response.message
        });
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || t('auth:otp.errorSendingCode'));
    } finally {
      setLoading(false);
    }
  };
  
  // Verify OTP and convert
  const handleVerifyOTP = async (data: VerifyFormData) => {
    setError('');
    setLoading(true);
    
    try {
      const response = await apiRequest('/api/prospect-lifecycle/verify-otp-convert', {
        method: 'POST',
        body: {
          leadId: Number(storedData.leadId),
          phoneNumber: storedData.phoneNumber,
          otpCode: data.otpCode
        }
      });
      
      if (response.success) {
        toast({
          title: t('auth:otp.registrationSuccessful'),
          description: response.message,
          variant: 'default'
        });
        
        if (onSuccess) {
          onSuccess(response.user);
        }
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || t('auth:otp.errorVerifyingCode'));
    } finally {
      setLoading(false);
    }
  };
  
  // Resend OTP
  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    phoneForm.handleSubmit(handleSendOTP)();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'} data-testid="otp-conversion-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {step === 'phone' ? (
            <>
              <Phone className="h-5 w-5" />
              {t('auth:otp.title')}
            </>
          ) : (
            <>
              <Key className="h-5 w-5" />
              {t('auth:otp.enterVerificationCode')}
            </>
          )}
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? t('auth:otp.enterIdAndPhone')
            : t('auth:otp.enterCodeSent')
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" data-testid="otp-error-alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {step === 'phone' ? (
          <Form {...phoneForm}>
            <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
              <FormField
                control={phoneForm.control}
                name="leadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth:otp.leadId')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder={t('auth:otp.leadIdPlaceholder')}
                        disabled={!!leadId}
                        data-testid="input-lead-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={phoneForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth:otp.mobileNumber')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="09123456789"
                        disabled={!!phoneNumber}
                        dir="ltr"
                        data-testid="input-phone-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                data-testid="button-send-otp"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t('auth:otp.sendVerificationCode')
                )}
              </Button>
            </form>
          </Form>
        ) : (
          <>
            <Form {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                <FormField
                  control={verifyForm.control}
                  name="otpCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('auth:otp.verificationCode')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder={t('auth:otp.sixDigitCode')}
                          maxLength={6}
                          dir="ltr"
                          className="text-center text-2xl tracking-widest"
                          autoFocus
                          data-testid="input-otp-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {otpSent && (
                  <Alert data-testid="alert-otp-sent">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      {t('auth:otp.codeSentTo', { phoneNumber: storedData.phoneNumber })}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  data-testid="button-verify-otp"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('auth:otp.verifyAndCreateAccount')
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="flex justify-between items-center text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('phone')}
                disabled={loading}
                data-testid="button-edit-number"
              >
                {t('auth:otp.editNumber')}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={loading || resendTimer > 0}
                data-testid="button-resend-otp"
              >
                {resendTimer > 0 
                  ? t('auth:otp.resendIn', { seconds: resendTimer })
                  : t('auth:otp.resendCode')
                }
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}