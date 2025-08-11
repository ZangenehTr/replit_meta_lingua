import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, GraduationCap, Phone, Mail } from "lucide-react";
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
            {t('auth:welcomeMessage')}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {authError && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('auth:signIn')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth:signUp')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth:email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t('auth:emailPlaceholder')}
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                
                {!useOtp ? (
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t('auth:password')}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t('auth:passwordPlaceholder')}
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
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
                  
                  <Button type="submit" className="flex-1" disabled={loginLoading}>
                    {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('auth:signIn')}
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
        </CardContent>
      </Card>
    </div>
  );
}
