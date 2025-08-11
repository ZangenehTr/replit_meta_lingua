import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { 
  Loader2, 
  GraduationCap, 
  Phone, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Languages,
  Globe2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";

export default function Auth() {
  const { t } = useTranslation(['auth', 'common']);
  const { isRTL } = useLanguage();
  
  const loginSchema = z.object({
    email: z.string().email(t('auth:invalidEmail')),
    password: z.string().optional(),
    otp: z.string().optional(),
  }).refine((data) => data.password || data.otp, {
    message: "Either password or OTP is required",
    path: ["password"],
  });
  
  const registerSchema = z.object({
    email: z.string().email(t('auth:invalidEmail')),
    password: z.string().min(6, t('auth:passwordMinLength')),
    firstName: z.string().min(2, t('auth:firstNameMinLength')),
    lastName: z.string().min(2, t('auth:lastNameMinLength')),
  });
  
  type LoginFormData = z.infer<typeof loginSchema>;
  type RegisterFormData = z.infer<typeof registerSchema>;
  
  const [, setLocation] = useLocation();
  const { user, login, register: registerUser, loginLoading, registerLoading, logout } = useAuth();
  const [authError, setAuthError] = useState<string>("");
  const [forceLogin, setForceLogin] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  // Check for logout parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('logout') === 'true') {
      logout();
      setForceLogin(true);
      // Clean URL
      window.history.replaceState({}, document.title, "/auth");
    }
  }, [logout]);

  // Redirect based on user role when user data is available (unless forcing login)
  useEffect(() => {
    if (user && !forceLogin) {
      // All roles redirect to unified dashboard page
      setLocation("/dashboard");
    }
  }, [user, setLocation, forceLogin]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      otp: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const requestOtp = async () => {
    const email = loginForm.getValues("email");
    if (!email) {
      setAuthError(t('auth:emailRequired') || "Email is required");
      return;
    }

    setOtpLoading(true);
    setOtpMessage("");
    setAuthError("");
    
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setOtpSent(true);
        setOtpMessage(result.message || "OTP sent to your registered phone number");
        setUseOtp(true);
        loginForm.setValue("password", ""); // Clear password field
      } else {
        setAuthError(result.message || "Failed to send OTP");
      }
    } catch (error) {
      setAuthError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setAuthError("");
    try {
      // Include OTP in login if using OTP
      const loginData = useOtp 
        ? { email: data.email, otp: data.otp }
        : { email: data.email, password: data.password };
      
      await login(loginData);
      // Login doesn't return user directly, we need to wait for the user query to refetch
      // The redirect will happen in a useEffect that watches for user changes
    } catch (error: any) {
      setAuthError(error.message || t('auth:loginFailed'));
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setAuthError("");
    try {
      await registerUser({ 
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "student" 
      });
      setLocation("/dashboard");
    } catch (error: any) {
      setAuthError(error.message || t('auth:registrationFailed'));
    }
  };

  const handleLogout = () => {
    logout();
    setForceLogin(true);
  };

  // Show logout option if user is logged in and not forcing login
  if (user && !forceLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">{t('auth:metaLingua')}</h1>
            </div>
            <CardDescription>
              {t('auth:loggedInAs', { firstName: user.firstName, lastName: user.lastName, role: user.role })}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              onClick={() => setLocation("/dashboard")}
              className="w-full"
            >
              {t('auth:goToDashboard')}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full"
            >
              {t('auth:switchAccount')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      >
        {/* Header Section with Logo */}
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
            {t('auth:metaLingua', 'Meta Lingua')}
          </h1>
          <p className="text-white/90 text-sm sm:text-base flex items-center justify-center gap-2">
            <Languages className="w-4 h-4" />
            {t('auth:tagline', 'Your Journey to Language Mastery')}
          </p>
        </motion.div>
        
        {/* Login Form Container */}
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

              <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-lg">{t('auth:signIn')}</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white/20 text-white data-[state=active]:text-white rounded-lg">{t('auth:signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/90 text-sm font-medium">{t('auth:email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('auth:emailPlaceholder')}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30"
                      {...loginForm.register("email")}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-300">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                {!useOtp ? (
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white/90 text-sm font-medium">{t('auth:password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t('auth:passwordPlaceholder')}
                        className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl focus:bg-white/15 focus:border-white/30"
                        {...loginForm.register("password")}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-300">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="login-otp">{t('auth:otpCode') || 'Verification Code'}</Label>
                    <Input
                      id="login-otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      {...loginForm.register("otp")}
                    />
                    {otpMessage && (
                      <p className="text-sm text-green-600">{otpMessage}</p>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  {!useOtp ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={requestOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="mr-2 h-4 w-4" />
                      )}
                      {t('auth:loginWithOtp') || 'Login with SMS Code'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setUseOtp(false);
                        setOtpSent(false);
                        loginForm.setValue("otp", "");
                      }}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {t('auth:usePassword') || 'Use Password'}
                    </Button>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('auth:signIn')}
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </div>
                
                {useOtp && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={requestOtp}
                    disabled={otpLoading}
                  >
                    {t('auth:resendOtp') || 'Resend Code'}
                  </Button>
                )}
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('auth:firstName')}</Label>
                    <Input
                      id="firstName"
                      placeholder={t('auth:firstNamePlaceholder')}
                      {...registerForm.register("firstName")}
                    />
                    {registerForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('auth:lastName')}</Label>
                    <Input
                      id="lastName"
                      placeholder={t('auth:lastNamePlaceholder')}
                      {...registerForm.register("lastName")}
                    />
                    {registerForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">
                        {registerForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('auth:email')}</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder={t('auth:emailPlaceholder')}
                    {...registerForm.register("email")}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('auth:password')}</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder={t('auth:passwordPlaceholder')}
                    {...registerForm.register("password")}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={registerLoading}>
                  {registerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('auth:createAccount')}
                </Button>
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
