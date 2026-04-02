import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Zap,
  Server,
  Users,
  GraduationCap,
  Phone,
  CreditCard,
  Brain,
  Settings,
  Shield,
  Database,
  Loader2,
  FileText,
  Activity
} from "lucide-react";

interface EndpointTest {
  name: string;
  nameEn: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  description: string;
  descriptionEn: string;
  requiresAuth: boolean;
}

interface TestCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: React.ReactNode;
  endpoints: EndpointTest[];
}

interface TestResult {
  endpoint: string;
  status: "pending" | "running" | "success" | "error" | "warning";
  statusCode?: number;
  responseTime?: number;
  message?: string;
  error?: string;
}

const TEST_CATEGORIES: TestCategory[] = [
  {
    id: "health",
    name: "سلامت سیستم",
    nameEn: "System Health",
    icon: <Activity className="h-4 w-4" />,
    endpoints: [
      { name: "بررسی سلامت سرور", nameEn: "Server Health Check", endpoint: "/api/health", method: "GET", description: "وضعیت کلی سرور", descriptionEn: "Overall server status", requiresAuth: false },
      { name: "وضعیت دیتابیس", nameEn: "Database Status", endpoint: "/api/smoke-test/database", method: "GET", description: "اتصال به پایگاه داده", descriptionEn: "Database connection", requiresAuth: true },
      { name: "وضعیت AI", nameEn: "AI Status", endpoint: "/api/smoke-test/ai", method: "GET", description: "سرویس‌های هوش مصنوعی", descriptionEn: "AI services", requiresAuth: true },
      { name: "وضعیت SMS", nameEn: "SMS Status", endpoint: "/api/smoke-test/sms", method: "GET", description: "سرویس پیامک کاوه‌نگار", descriptionEn: "Kavenegar SMS service", requiresAuth: true },
    ]
  },
  {
    id: "auth",
    name: "احراز هویت",
    nameEn: "Authentication",
    icon: <Shield className="h-4 w-4" />,
    endpoints: [
      { name: "وضعیت نشست", nameEn: "Session Status", endpoint: "/api/auth/session", method: "GET", description: "بررسی نشست فعلی کاربر", descriptionEn: "Check current user session", requiresAuth: true },
      { name: "پروفایل کاربر", nameEn: "User Profile", endpoint: "/api/user", method: "GET", description: "اطلاعات کاربر جاری", descriptionEn: "Current user information", requiresAuth: true },
    ]
  },
  {
    id: "admin",
    name: "مدیریت",
    nameEn: "Administration",
    icon: <Settings className="h-4 w-4" />,
    endpoints: [
      { name: "آمار داشبورد", nameEn: "Dashboard Stats", endpoint: "/api/admin/stats", method: "GET", description: "آمار کلی پلتفرم", descriptionEn: "Platform overall statistics", requiresAuth: true },
      { name: "لیست کاربران", nameEn: "Users List", endpoint: "/api/users", method: "GET", description: "لیست تمام کاربران", descriptionEn: "All users list", requiresAuth: true },
      { name: "لیست دوره‌ها", nameEn: "Courses List", endpoint: "/api/admin/courses", method: "GET", description: "لیست دوره‌های آموزشی", descriptionEn: "Educational courses list", requiresAuth: true },
      { name: "لیست کلاس‌ها", nameEn: "Classes List", endpoint: "/api/classes", method: "GET", description: "لیست کلاس‌های فعال", descriptionEn: "Active classes list", requiresAuth: true },
    ]
  },
  {
    id: "students",
    name: "دانش‌آموزان",
    nameEn: "Students",
    icon: <GraduationCap className="h-4 w-4" />,
    endpoints: [
      { name: "لیست دانش‌آموزان", nameEn: "Students List", endpoint: "/api/students", method: "GET", description: "لیست تمام دانش‌آموزان", descriptionEn: "All students list", requiresAuth: true },
      { name: "پیشرفت تحصیلی", nameEn: "Learning Progress", endpoint: "/api/student/learning-progress", method: "GET", description: "گزارش پیشرفت دانش‌آموزان", descriptionEn: "Students progress report", requiresAuth: true },
    ]
  },
  {
    id: "teachers",
    name: "معلمان",
    nameEn: "Teachers",
    icon: <Users className="h-4 w-4" />,
    endpoints: [
      { name: "لیست معلمان", nameEn: "Teachers List", endpoint: "/api/teachers", method: "GET", description: "لیست تمام معلمان", descriptionEn: "All teachers list", requiresAuth: true },
      { name: "عملکرد معلمان", nameEn: "Teacher Performance", endpoint: "/api/teacher-qa/performance", method: "GET", description: "گزارش عملکرد معلمان", descriptionEn: "Teachers performance report", requiresAuth: true },
    ]
  },
  {
    id: "callcenter",
    name: "مرکز تماس",
    nameEn: "Call Center",
    icon: <Phone className="h-4 w-4" />,
    endpoints: [
      { name: "داشبورد مرکز تماس", nameEn: "Call Center Dashboard", endpoint: "/api/callcenter/dashboard", method: "GET", description: "آمار مرکز تماس", descriptionEn: "Call center statistics", requiresAuth: true },
      { name: "لیست سرنخ‌ها", nameEn: "Leads List", endpoint: "/api/leads", method: "GET", description: "لیست سرنخ‌های فروش", descriptionEn: "Sales leads list", requiresAuth: true },
      { name: "کمپین‌ها", nameEn: "Campaigns", endpoint: "/api/callcenter/campaigns", method: "GET", description: "کمپین‌های بازاریابی", descriptionEn: "Marketing campaigns", requiresAuth: true },
    ]
  },
  {
    id: "financial",
    name: "مالی",
    nameEn: "Financial",
    icon: <CreditCard className="h-4 w-4" />,
    endpoints: [
      { name: "تراکنش‌های کیف پول", nameEn: "Wallet Transactions", endpoint: "/api/wallet/transactions", method: "GET", description: "لیست تراکنش‌های مالی", descriptionEn: "Financial transactions list", requiresAuth: true },
      { name: "گزارش مالی", nameEn: "Financial Report", endpoint: "/api/accountant/reports", method: "GET", description: "گزارش‌های مالی", descriptionEn: "Financial reports", requiresAuth: true },
      { name: "پرداخت معلمان", nameEn: "Teacher Payments", endpoint: "/api/accountant/teacher-payments", method: "GET", description: "پرداختی‌های معلمان", descriptionEn: "Teachers payments", requiresAuth: true },
    ]
  },
  {
    id: "ai",
    name: "هوش مصنوعی",
    nameEn: "AI Services",
    icon: <Brain className="h-4 w-4" />,
    endpoints: [
      { name: "وضعیت Ollama", nameEn: "Ollama Status", endpoint: "/api/ai/status", method: "GET", description: "وضعیت سرویس Ollama", descriptionEn: "Ollama service status", requiresAuth: true },
      { name: "مدل‌های AI", nameEn: "AI Models", endpoint: "/api/ai/models", method: "GET", description: "لیست مدل‌های موجود", descriptionEn: "Available models list", requiresAuth: true },
    ]
  },
  {
    id: "content",
    name: "محتوا",
    nameEn: "Content",
    icon: <FileText className="h-4 w-4" />,
    endpoints: [
      { name: "لیست درس‌های LinguaQuest", nameEn: "LinguaQuest Lessons", endpoint: "/api/linguaquest/lessons", method: "GET", description: "درس‌های بازی‌محور", descriptionEn: "Gamified lessons", requiresAuth: false },
      { name: "دسته‌بندی‌های برنامه", nameEn: "Curriculum Categories", endpoint: "/api/curriculum-categories", method: "GET", description: "دسته‌بندی محتوای آموزشی", descriptionEn: "Educational content categories", requiresAuth: true },
      { name: "بانک محتوا", nameEn: "Content Bank", endpoint: "/api/content-bank", method: "GET", description: "محتوای آموزشی", descriptionEn: "Educational content", requiresAuth: true },
    ]
  },
  {
    id: "gamification",
    name: "گیمیفیکیشن",
    nameEn: "Gamification",
    icon: <Zap className="h-4 w-4" />,
    endpoints: [
      { name: "دستاوردها", nameEn: "Achievements", endpoint: "/api/gamification/achievements", method: "GET", description: "لیست دستاوردها", descriptionEn: "Achievements list", requiresAuth: true },
      { name: "تابلوی امتیازات", nameEn: "Leaderboards", endpoint: "/api/gamification/leaderboards", method: "GET", description: "رتبه‌بندی کاربران", descriptionEn: "Users ranking", requiresAuth: true },
      { name: "چالش‌های روزانه", nameEn: "Daily Challenges", endpoint: "/api/gamification/daily-challenges", method: "GET", description: "چالش‌های امروز", descriptionEn: "Today's challenges", requiresAuth: true },
    ]
  },
];

export default function ApiSmokeTestPage() {
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["health"]));
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const runSingleTest = useCallback(async (endpoint: EndpointTest): Promise<TestResult> => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(endpoint.endpoint, {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (response.ok) {
        return {
          endpoint: endpoint.endpoint,
          status: "success",
          statusCode: response.status,
          responseTime,
          message: `OK (${responseTime}ms)`,
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          endpoint: endpoint.endpoint,
          status: "warning",
          statusCode: response.status,
          responseTime,
          message: response.status === 401 ? "Unauthorized" : "Forbidden",
        };
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        return {
          endpoint: endpoint.endpoint,
          status: "error",
          statusCode: response.status,
          responseTime,
          error: errorText.substring(0, 100),
        };
      }
    } catch (error) {
      return {
        endpoint: endpoint.endpoint,
        status: "error",
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    const newResults: Record<string, TestResult> = {};
    
    const allEndpoints = TEST_CATEGORIES.flatMap(cat => cat.endpoints);
    
    for (const endpoint of allEndpoints) {
      setResults(prev => ({
        ...prev,
        [endpoint.endpoint]: { endpoint: endpoint.endpoint, status: "running" }
      }));
      
      const result = await runSingleTest(endpoint);
      newResults[endpoint.endpoint] = result;
      setResults(prev => ({ ...prev, [endpoint.endpoint]: result }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  }, [runSingleTest]);

  const runCategoryTests = useCallback(async (categoryId: string) => {
    setIsRunning(true);
    const category = TEST_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;
    
    for (const endpoint of category.endpoints) {
      setResults(prev => ({
        ...prev,
        [endpoint.endpoint]: { endpoint: endpoint.endpoint, status: "running" }
      }));
      
      const result = await runSingleTest(endpoint);
      setResults(prev => ({ ...prev, [endpoint.endpoint]: result }));
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsRunning(false);
  }, [runSingleTest]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status?: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">OK</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Warning</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Testing...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCategoryStats = (category: TestCategory) => {
    const categoryResults = category.endpoints.map(e => results[e.endpoint]);
    const total = category.endpoints.length;
    const success = categoryResults.filter(r => r?.status === "success").length;
    const errors = categoryResults.filter(r => r?.status === "error").length;
    const warnings = categoryResults.filter(r => r?.status === "warning").length;
    const tested = categoryResults.filter(r => r?.status && r.status !== "pending" && r.status !== "running").length;
    
    return { total, success, errors, warnings, tested };
  };

  const getOverallStats = () => {
    const allEndpoints = TEST_CATEGORIES.flatMap(cat => cat.endpoints);
    const total = allEndpoints.length;
    const success = Object.values(results).filter(r => r.status === "success").length;
    const errors = Object.values(results).filter(r => r.status === "error").length;
    const warnings = Object.values(results).filter(r => r.status === "warning").length;
    const tested = Object.values(results).filter(r => r.status && r.status !== "pending" && r.status !== "running").length;
    
    return { total, success, errors, warnings, tested };
  };

  const overallStats = getOverallStats();
  const progressPercentage = (overallStats.tested / overallStats.total) * 100;

  const filteredCategories = selectedCategory === "all" 
    ? TEST_CATEGORIES 
    : TEST_CATEGORIES.filter(c => c.id === selectedCategory);

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-6", isRTL && "rtl")}>
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Server className="h-6 w-6 text-blue-500" />
                  {language === "fa" ? "تست API ها" : "API Smoke Test"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === "fa" 
                    ? "تست سریع تمام نقاط پایانی API برای اطمینان از عملکرد صحیح سیستم"
                    : "Quick test all API endpoints to ensure system is working correctly"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Play className="h-4 w-4 me-2" />
                  )}
                  {language === "fa" ? "اجرای همه تست‌ها" : "Run All Tests"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResults({})}
                  disabled={isRunning}
                >
                  <RefreshCw className="h-4 w-4 me-2" />
                  {language === "fa" ? "پاک کردن" : "Clear"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-200">{overallStats.total}</div>
                <div className="text-sm text-slate-500">{language === "fa" ? "کل تست‌ها" : "Total Tests"}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600">{overallStats.success}</div>
                <div className="text-sm text-green-600">{language === "fa" ? "موفق" : "Passed"}</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-red-600">{overallStats.errors}</div>
                <div className="text-sm text-red-600">{language === "fa" ? "خطا" : "Failed"}</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-yellow-600">{overallStats.warnings}</div>
                <div className="text-sm text-yellow-600">{language === "fa" ? "هشدار" : "Warnings"}</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{overallStats.tested}</div>
                <div className="text-sm text-blue-600">{language === "fa" ? "تست شده" : "Tested"}</div>
              </div>
            </div>

            {overallStats.tested > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>{language === "fa" ? "پیشرفت" : "Progress"}</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900">
              {language === "fa" ? "همه" : "All"}
            </TabsTrigger>
            {TEST_CATEGORIES.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900"
              >
                <span className="flex items-center gap-1">
                  {category.icon}
                  {language === "fa" ? category.name : category.nameEn}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4 space-y-3">
            {filteredCategories.map(category => {
              const stats = getCategoryStats(category);
              const isExpanded = expandedCategories.has(category.id);
              
              return (
                <Card key={category.id} className="overflow-hidden shadow-sm">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          )}
                          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            {category.icon}
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {language === "fa" ? category.name : category.nameEn}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {stats.tested}/{stats.total} {language === "fa" ? "تست شده" : "tested"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stats.success > 0 && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                              {stats.success} ✓
                            </Badge>
                          )}
                          {stats.errors > 0 && (
                            <Badge variant="destructive">
                              {stats.errors} ✗
                            </Badge>
                          )}
                          {stats.warnings > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100">
                              {stats.warnings} ⚠
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              runCategoryTests(category.id);
                            }}
                            disabled={isRunning}
                          >
                            <Play className="h-3 w-3 me-1" />
                            {language === "fa" ? "تست" : "Test"}
                          </Button>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t dark:border-slate-700">
                        {category.endpoints.map((endpoint, idx) => {
                          const result = results[endpoint.endpoint];
                          
                          return (
                            <div
                              key={endpoint.endpoint}
                              className={cn(
                                "flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                                idx !== category.endpoints.length - 1 && "border-b dark:border-slate-700"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(result?.status)}
                                <div>
                                  <div className="font-medium text-sm">
                                    {language === "fa" ? endpoint.name : endpoint.nameEn}
                                  </div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">
                                      {endpoint.method}
                                    </code>
                                    <span className="font-mono">{endpoint.endpoint}</span>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5">
                                    {language === "fa" ? endpoint.description : endpoint.descriptionEn}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {result?.responseTime && (
                                  <span className="text-xs text-slate-500">
                                    {result.responseTime}ms
                                  </span>
                                )}
                                {result?.statusCode && (
                                  <span className={cn(
                                    "text-xs font-mono px-2 py-0.5 rounded",
                                    result.statusCode >= 200 && result.statusCode < 300 
                                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                                      : result.statusCode >= 400 && result.statusCode < 500
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                                  )}>
                                    {result.statusCode}
                                  </span>
                                )}
                                {getStatusBadge(result?.status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        </Tabs>

        {Object.values(results).some(r => r.error) && (
          <Card className="border-red-200 dark:border-red-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                {language === "fa" ? "خطاهای شناسایی شده" : "Detected Errors"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {Object.entries(results)
                    .filter(([_, r]) => r.error)
                    .map(([endpoint, result]) => (
                      <div key={endpoint} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        <div className="font-mono text-sm text-red-700 dark:text-red-300">{endpoint}</div>
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">{result.error}</div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
