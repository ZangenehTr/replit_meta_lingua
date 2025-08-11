import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ChevronRight,
  Sparkles,
  GraduationCap,
  Languages,
  Globe2
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";

export default function SimpleAuth() {
  const [, setLocation] = useLocation();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { direction, isRTL } = useLanguage();
  const { t } = useTranslation(['auth', 'common']);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store token
      if (data.auth_token) {
        localStorage.setItem("auth_token", data.auth_token);
      }

      // Redirect based on role
      if (data.user.role === 'Admin') {
        setLocation("/admin");
      } else if (data.user.role === 'Teacher/Tutor') {
        setLocation("/teacher/dashboard");
      } else if (data.user.role === 'Supervisor') {
        setLocation("/supervisor/dashboard");
      } else {
        setLocation("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Login error:", err);
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
            {t('auth:appName', 'Meta Lingua')}
          </h1>
          <p className="text-white/90 text-sm sm:text-base flex items-center justify-center gap-2">
            <Languages className="w-4 h-4" />
            {t('auth:tagline', 'Your Journey to Language Mastery')}
          </p>
        </motion.div>

        {/* Login Form Section */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex-1 flex flex-col justify-center px-6 sm:px-8 pb-8"
        >
          <div className="w-full max-w-sm mx-auto space-y-6">
            {/* Welcome Text */}
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                {t('auth:welcomeBack', 'Welcome Back!')}
              </h2>
              <p className="text-white/80 text-sm">
                {t('auth:signInToContinue', 'Sign in to continue your learning journey')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <div className={`relative bg-white/10 backdrop-blur-md rounded-2xl border ${
                  focusedField === 'email' ? 'border-white/50' : 'border-white/20'
                } transition-all duration-300`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/70" />
                  </div>
                  <input
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent pl-12 pr-4 py-4 text-white placeholder-white/50 focus:outline-none"
                    placeholder={t('auth:emailPlaceholder', 'your@email.com')}
                    required
                  />
                </div>
                {focusedField === 'email' && credentials.email === '' && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-white/70 mt-1 ml-4"
                  >
                    {t('auth:enterEmail', 'Enter your email address')}
                  </motion.p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <div className={`relative bg-white/10 backdrop-blur-md rounded-2xl border ${
                  focusedField === 'password' ? 'border-white/50' : 'border-white/20'
                } transition-all duration-300`}>
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/70" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent pl-12 pr-12 py-4 text-white placeholder-white/50 focus:outline-none"
                    placeholder={t('auth:passwordPlaceholder', '••••••••')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white px-4 py-3 rounded-xl text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white text-purple-600 font-semibold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </motion.div>
                    <span>{t('auth:signingIn', 'Signing in...')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth:signIn', 'Sign In')}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>

              {/* Alternative Login Options */}
              <div className="flex items-center justify-center space-x-4 pt-2">
                <button
                  type="button"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                  onClick={() => setLocation('/auth/otp')}
                >
                  {t('auth:loginWithOtp', 'Login with OTP')}
                </button>
                <span className="text-white/50">•</span>
                <button
                  type="button"
                  className="text-white/70 hover:text-white text-sm transition-colors"
                  onClick={() => setLocation('/auth/forgot-password')}
                >
                  {t('auth:forgotPassword', 'Forgot Password?')}
                </button>
              </div>
            </form>

            {/* Demo Accounts - Subtle at bottom */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-white/20"
            >
              <p className="text-center text-white/60 text-xs mb-3">
                {t('auth:demoAccounts', 'Demo Accounts')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { role: 'Student', email: 'student@test.com', pass: 'student123', icon: '🎓' },
                  { role: 'Teacher', email: 'teacher@test.com', pass: 'teacher123', icon: '👨‍🏫' },
                  { role: 'Admin', email: 'admin@test.com', pass: 'admin123', icon: '👤' }
                ].map((account, idx) => (
                  <motion.button
                    key={idx}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCredentials({ email: account.email, password: account.pass })}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2 text-center hover:bg-white/20 transition-all"
                  >
                    <div className="text-lg mb-1">{account.icon}</div>
                    <div className="text-white text-xs font-medium">{account.role}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex-shrink-0 pb-6 text-center"
        >
          <p className="text-white/60 text-xs">
            © 2025 Meta Lingua • {t('auth:allRightsReserved', 'All rights reserved')}
          </p>
        </motion.div>
      </motion.div>


    </div>
  );
}