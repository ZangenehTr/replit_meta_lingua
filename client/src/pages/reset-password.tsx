import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocation } from "wouter";
import { 
  Loader2, 
  GraduationCap, 
  ChevronLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import DynamicForm from "@/components/forms/DynamicForm";

export default function ResetPassword() {
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string>("");

  // Get token from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError(t('auth:invalidResetToken', 'Invalid or missing reset token'));
    }
  }, [t]);

  // Fetch Reset Password form definition (Form ID 4)
  const { data: formDefinition, isLoading: formLoading } = useQuery({
    queryKey: ['/api/forms/4'],
  });

  const handleSubmit = async (data: Record<string, any>) => {
    if (!token) {
      setError(t('auth:invalidResetToken', 'Invalid or missing reset token'));
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        setMessage(result.message || t('auth:passwordResetSuccess', 'Password has been reset successfully!'));
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation("/auth");
        }, 3000);
      } else {
        setError(result.message || t('auth:passwordResetFailed', 'Failed to reset password.'));
      }
    } catch (error) {
      setError(t('auth:passwordResetFailed', 'Failed to reset password. Please try again.'));
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
            {t('auth:resetPassword', 'Reset Password')}
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            {t('auth:resetPasswordSubtitle', 'Enter your new password')}
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
                      <p className="font-medium text-sm">{t('auth:passwordResetSuccessTitle', 'Password Reset!')}</p>
                      <p className="text-sm text-green-100 mt-1">{message}</p>
                      <p className="text-xs text-green-100 mt-2">{t('auth:redirectingToLogin', 'Redirecting to login...')}</p>
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

              {!isSuccess && token ? (
                formLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                ) : formDefinition ? (
                  <DynamicForm
                    formDefinition={formDefinition}
                    onSubmit={handleSubmit}
                    isSubmitting={isLoading}
                    submitButtonClassName="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                    fieldClassName="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30"
                    labelClassName="text-white/90 text-sm font-medium"
                    errorClassName="text-sm text-red-300"
                  />
                ) : (
                  <div className="text-center text-white/80 text-sm">
                    {t('common:formNotFound', 'Form definition not found')}
                  </div>
                )
              ) : !isSuccess && !token ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-300" />
                  </div>
                  <p className="text-white/80 text-sm">
                    {t('auth:invalidTokenMessage', 'This password reset link is invalid or has expired.')}
                  </p>
                  <Button
                    onClick={() => setLocation("/forgot-password")}
                    className="w-full h-12 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl border border-white/30"
                  >
                    {t('auth:requestNewLink', 'Request New Reset Link')}
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}