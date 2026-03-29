import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { 
  Loader2, 
  GraduationCap, 
  Phone, 
  ChevronRight,
  Sparkles,
  Languages,
  RefreshCw
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

export default function Auth() {
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  // Capture UTM params and referral code from URL on mount
  const utmParams = (() => {
    const p = new URLSearchParams(window.location.search);
    return {
      utmSource: p.get("utm_source") || undefined,
      utmMedium: p.get("utm_medium") || undefined,
      utmCampaign: p.get("utm_campaign") || undefined,
      referralCode: p.get("ref") || undefined,
    };
  })();
  const [authError, setAuthError] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const [otpCountdownDisplay, setOtpCountdownDisplay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  const loginSchema = z.object({
    phoneNumber: z.string().min(10, "شماره تلفن باید حداقل ۱۰ رقم باشد"),
    otp: z.string().length(6, "کد تأیید باید ۶ رقم باشد").optional(),
  });
  
  const registerSchema = z.object({
    phoneNumber: z.string().min(10, "شماره تلفن باید حداقل ۱۰ رقم باشد"),
    firstName: z.string().min(2, "نام باید حداقل ۲ حرف باشد"),
    lastName: z.string().min(2, "نام خانوادگی باید حداقل ۲ حرف باشد"),
    otp: z.string().length(6, "کد تأیید باید ۶ رقم باشد").optional(),
  });
  
  type LoginFormData = z.infer<typeof loginSchema>;
  type RegisterFormData = z.infer<typeof registerSchema>;
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
      otp: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phoneNumber: "",
      firstName: "",
      lastName: "",
      otp: "",
    },
  });

  useEffect(() => {
    if (otpResendCooldown <= 0) {
      setOtpCountdownDisplay("");
      return;
    }

    const timer = setInterval(() => {
      setOtpResendCooldown(prev => {
        const newVal = prev - 1;
        if (newVal <= 0) {
          setOtpCountdownDisplay("");
          return 0;
        }
        setOtpCountdownDisplay(`${newVal}s`);
        return newVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  const requestOtpForLogin = async () => {
    const phoneNumber = loginForm.getValues("phoneNumber");
    if (!phoneNumber || phoneNumber.length < 10) {
      setAuthError("لطفاً شماره تلفن معتبر وارد کنید");
      return;
    }

    if (otpResendCooldown > 0) {
      setAuthError(`⏱️ لطفاً ${otpResendCooldown} ثانیه صبر کنید`);
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");
    setAuthError("");
    
    try {
      const response = await fetch("/api/auth/phone/request-otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, locale: 'fa' }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setOtpMessage(result.message || "✅ کد تأیید به شماره تلفن شما ارسال شد");
        setOtpResendCooldown(90);
        setOtpCountdownDisplay("90s");
      } else {
        setAuthError(result.message || "خطا در ارسال کد تأیید");
      }
    } catch (error) {
      setAuthError("خطا در ارسال کد. لطفاً دوباره تلاش کنید.");
    } finally {
      setOtpLoading(false);
    }
  };

  const requestOtpForSignup = async () => {
    const phoneNumber = registerForm.getValues("phoneNumber");
    const firstName = registerForm.getValues("firstName");
    const lastName = registerForm.getValues("lastName");
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setAuthError("لطفاً شماره تلفن معتبر وارد کنید");
      return;
    }
    
    if (!firstName || firstName.length < 2) {
      setAuthError("لطفاً نام خود را وارد کنید");
      return;
    }
    
    if (!lastName || lastName.length < 2) {
      setAuthError("لطفاً نام خانوادگی خود را وارد کنید");
      return;
    }

    if (otpResendCooldown > 0) {
      setAuthError(`⏱️ لطفاً ${otpResendCooldown} ثانیه صبر کنید`);
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");
    setAuthError("");
    
    try {
      const response = await fetch("/api/auth/phone/request-otp-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phoneNumber, 
          firstName,
          lastName,
          role: 'Student',
          locale: 'fa' 
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setOtpMessage(result.message || "✅ کد تأیید به شماره تلفن شما ارسال شد");
        setOtpResendCooldown(90);
        setOtpCountdownDisplay("90s");
      } else {
        setAuthError(result.message || "خطا در ارسال کد تأیید");
      }
    } catch (error) {
      setAuthError("خطا در ارسال کد. لطفاً دوباره تلاش کنید.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    if (!data.otp || data.otp.length !== 6) {
      setAuthError("لطفاً کد تأیید ۶ رقمی را وارد کنید");
      return;
    }

    setAuthError("");
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/phone/verify-otp-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          code: data.otp,
          purpose: 'login',
          locale: 'fa'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Handle tokens - backend returns them in result.tokens object
        const accessToken = result.tokens?.accessToken || result.accessToken;
        const refreshToken = result.tokens?.refreshToken || result.refreshToken;
        
        if (accessToken) {
          localStorage.setItem("auth_token", accessToken);
        }
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        window.location.href = "/dashboard";
      } else {
        setAuthError(result.message || "کد تأیید نادرست است");
      }
    } catch (error: any) {
      setAuthError(error.message || "خطا در ورود");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    if (!data.otp || data.otp.length !== 6) {
      setAuthError("لطفاً کد تأیید ۶ رقمی را وارد کنید");
      return;
    }

    setAuthError("");
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/auth/phone/verify-otp-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          code: data.otp,
          purpose: 'registration',
          locale: 'fa',
          role: 'Student',
          ...utmParams,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        // Handle tokens - backend returns them in result.tokens object
        const accessToken = result.tokens?.accessToken || result.accessToken;
        const refreshToken = result.tokens?.refreshToken || result.refreshToken;
        
        if (accessToken) {
          localStorage.setItem("auth_token", accessToken);
        }
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
        }
        window.location.href = "/dashboard";
      } else {
        setAuthError(result.message || "خطا در ثبت‌نام");
      }
    } catch (error: any) {
      setAuthError(error.message || "خطا در ثبت‌نام");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register");
    setAuthError("");
    setOtpSent(false);
    setOtpMessage("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" dir="rtl">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 min-h-screen flex flex-col"
      >
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-shrink-0 pt-12 sm:pt-16 pb-8 px-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-lg rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                <GraduationCap className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-300 absolute top-0 right-0" />
              </motion.div>
            </motion.div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            متالینگوآ
          </h1>
          <p className="text-white/90 text-sm sm:text-base flex items-center justify-center gap-2">
            <Languages className="w-4 h-4" />
            سفر شما به تسلط بر زبان
          </p>
        </motion.div>
        
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm rounded-2xl border border-red-500/30"
                >
                  <p className="text-white text-sm">{authError}</p>
                </motion.div>
              )}

              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                  <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-lg">
                    ورود
                  </TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-lg">
                    ثبت‌نام
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="text-white/90 text-sm font-medium">شماره تلفن</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <Input
                          id="login-phone"
                          type="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30 text-left"
                          dir="ltr"
                          {...loginForm.register("phoneNumber")}
                        />
                      </div>
                      {loginForm.formState.errors.phoneNumber && (
                        <p className="text-sm text-red-300">
                          {loginForm.formState.errors.phoneNumber.message}
                        </p>
                      )}
                    </div>
                    
                    {otpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="login-otp" className="text-white/90 text-sm font-medium">کد تأیید</Label>
                        <Input
                          id="login-otp"
                          type="text"
                          placeholder="کد ۶ رقمی"
                          maxLength={6}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30 text-center text-lg tracking-widest"
                          dir="ltr"
                          {...loginForm.register("otp")}
                        />
                        {otpMessage && (
                          <p className="text-sm text-green-300">{otpMessage}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      {!otpSent ? (
                        <Button
                          type="button"
                          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={requestOtpForLogin}
                          disabled={otpLoading}
                        >
                          {otpLoading ? (
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Phone className="ml-2 h-5 w-5" />
                              ارسال کد تأیید
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-2">
                                ورود
                                <ChevronRight className="w-5 h-5" />
                              </span>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            className={`w-full h-10 font-medium rounded-xl transition-all duration-200 ${
                              otpResendCooldown > 0
                                ? "bg-white/5 text-white/50 cursor-not-allowed"
                                : "bg-transparent hover:bg-white/10 text-white/70 hover:text-white"
                            }`}
                            onClick={requestOtpForLogin}
                            disabled={otpLoading || otpResendCooldown > 0}
                          >
                            <RefreshCw className={`ml-2 h-4 w-4 ${otpLoading ? "animate-spin" : ""}`} />
                            {otpResendCooldown > 0 
                              ? `ارسال مجدد (${otpCountdownDisplay})`
                              : "ارسال مجدد کد"
                            }
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white/90 text-sm font-medium">نام</Label>
                        <Input
                          id="firstName"
                          placeholder="نام"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30"
                          {...registerForm.register("firstName")}
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-300">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white/90 text-sm font-medium">نام خانوادگی</Label>
                        <Input
                          id="lastName"
                          placeholder="نام خانوادگی"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30"
                          {...registerForm.register("lastName")}
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-300">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-white/90 text-sm font-medium">شماره تلفن</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          className="pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30 text-left"
                          dir="ltr"
                          {...registerForm.register("phoneNumber")}
                        />
                      </div>
                      {registerForm.formState.errors.phoneNumber && (
                        <p className="text-sm text-red-300">
                          {registerForm.formState.errors.phoneNumber.message}
                        </p>
                      )}
                    </div>
                    
                    {otpSent && (
                      <div className="space-y-2">
                        <Label htmlFor="register-otp" className="text-white/90 text-sm font-medium">کد تأیید</Label>
                        <Input
                          id="register-otp"
                          type="text"
                          placeholder="کد ۶ رقمی"
                          maxLength={6}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30 text-center text-lg tracking-widest"
                          dir="ltr"
                          {...registerForm.register("otp")}
                        />
                        {otpMessage && (
                          <p className="text-sm text-green-300">{otpMessage}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      {!otpSent ? (
                        <Button
                          type="button"
                          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]"
                          onClick={requestOtpForSignup}
                          disabled={otpLoading}
                        >
                          {otpLoading ? (
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Phone className="ml-2 h-5 w-5" />
                              ارسال کد تأیید
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]" 
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <span className="flex items-center gap-2">
                                ثبت‌نام
                                <ChevronRight className="w-5 h-5" />
                              </span>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            className={`w-full h-10 font-medium rounded-xl transition-all duration-200 ${
                              otpResendCooldown > 0
                                ? "bg-white/5 text-white/50 cursor-not-allowed"
                                : "bg-transparent hover:bg-white/10 text-white/70 hover:text-white"
                            }`}
                            onClick={requestOtpForSignup}
                            disabled={otpLoading || otpResendCooldown > 0}
                          >
                            <RefreshCw className={`ml-2 h-4 w-4 ${otpLoading ? "animate-spin" : ""}`} />
                            {otpResendCooldown > 0 
                              ? `ارسال مجدد (${otpCountdownDisplay})`
                              : "ارسال مجدد کد"
                            }
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
