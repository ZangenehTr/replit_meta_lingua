import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  GraduationCap, 
  ChevronLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import DynamicForm from "@/components/forms/DynamicForm";

const FORGOT_PASSWORD_FORM_ID = 1;

interface FormDefinition {
  id: number;
  title: string;
  fields: any[];
  [key: string]: any;
}

export default function ForgotPassword() {
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Fetch form definition
  const { data: formDefinition, isLoading: formLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', FORGOT_PASSWORD_FORM_ID],
  });

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(result.message || t('auth:resetLinkSent', 'Password reset instructions have been sent to your email and phone.'));
      } else {
        setError(result.message || t('auth:resetRequestFailed', 'Failed to process password reset request.'));
      }
    } catch (error) {
      setError(t('auth:resetRequestFailed', 'Failed to process password reset request. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 min-h-screen flex flex-col"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header Section */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 pt-12 sm:pt-16 pb-8 px-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t('auth:forgotPassword', 'Forgot Password')}
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            {t('auth:forgotPasswordSubtitle', 'Enter your email to reset your password')}
          </p>
        </motion.div>
        
        {/* Reset Form Container */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              {/* Back to Login Button */}
              <Button
                variant="ghost"
                onClick={() => setLocation("/auth")}
                className="mb-6 text-white/80 hover:text-white hover:bg-white/10 p-2"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('auth:backToLogin', 'Back to Login')}
              </Button>

              {/* Success Message */}
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-500/20 backdrop-blur-sm rounded-2xl border border-green-500/30"
                >
                  <div className="flex items-center text-white">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-300" />
                    <div>
                      <p className="font-medium text-sm">{t('auth:resetLinkSentTitle', 'Reset Link Sent!')}</p>
                      <p className="text-sm text-green-100 mt-1">{message}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-500/30"
                >
                  <div className="flex items-center text-white">
                    <AlertCircle className="w-5 h-5 mr-3 text-red-300" />
                    <p className="text-sm">{error}</p>
                  </div>
                </motion.div>
              )}

              {!isSuccess ? (
                formLoading ? (
                  <div className="text-center text-white/70">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm">{t('common:loading', 'Loading...')}</p>
                  </div>
                ) : formDefinition ? (
                  <div className="[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-white/50 [&_input]:h-12 [&_input]:rounded-xl [&_input]:focus:bg-white/15 [&_input]:focus:border-white/30 [&_label]:text-white/90 [&_label]:text-sm [&_label]:font-medium [&_button[type=submit]]:w-full [&_button[type=submit]]:h-12 [&_button[type=submit]]:bg-gradient-to-r [&_button[type=submit]]:from-purple-500 [&_button[type=submit]]:to-pink-500 hover:[&_button[type=submit]]:from-purple-600 hover:[&_button[type=submit]]:to-pink-600 [&_button[type=submit]]:text-white [&_button[type=submit]]:font-semibold [&_button[type=submit]]:rounded-xl [&_button[type=submit]]:shadow-lg [&_button[type=submit]]:shadow-purple-500/25 [&_.error-message]:text-red-300 [&_.error-message]:text-sm">
                    <DynamicForm 
                      formDefinition={formDefinition}
                      onSubmit={handleSubmit}
                      disabled={isLoading}
                      showTitle={false}
                    />
                    <div className="text-center text-white/70 text-sm mt-6">
                      <p>{t('auth:resetInstructions', 'You will receive password reset instructions via email and SMS.')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white/70">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-300" />
                    <p className="text-sm">{t('common:errorLoading', 'Error loading form')}</p>
                  </div>
                )
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-300" />
                  </div>
                  <p className="text-white/80 text-sm">
                    {t('auth:checkEmailAndPhone', 'Please check your email and phone for password reset instructions.')}
                  </p>
                  <Button
                    onClick={() => setLocation("/auth")}
                    className="w-full h-12 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl border border-white/30"
                  >
                    {t('auth:backToLogin', 'Back to Login')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}