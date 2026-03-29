import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, CreditCard, Star, Trophy, Crown, Gem, Clock, Calendar, User, BookOpen, Tag, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WalletData {
  walletBalance: number;
  totalCredits: number;
  memberTier: string;
  discountPercentage: number;
}

interface AdminSettings {
  creditValueInRials: number;
  walletTopupIncrement: number;
  bronzeTierThreshold: number;
  silverTierThreshold: number;
  goldTierThreshold: number;
  diamondTierThreshold: number;
  bronzeDiscount: number;
  silverDiscount: number;
  goldDiscount: number;
  diamondDiscount: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  level: string;
  language: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  instructorId: number;
  isActive: boolean;
}

interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

const tierIcons = {
  bronze: <Trophy className="h-5 w-5 text-amber-600" />,
  silver: <Star className="h-5 w-5 text-gray-400" />,
  gold: <Crown className="h-5 w-5 text-yellow-500" />,
  diamond: <Gem className="h-5 w-5 text-purple-500" />
};

const tierColors = {
  bronze: "bg-gradient-to-r from-amber-500 to-orange-500",
  silver: "bg-gradient-to-r from-gray-400 to-gray-600",
  gold: "bg-gradient-to-r from-yellow-400 to-yellow-600",
  diamond: "bg-gradient-to-r from-purple-500 to-pink-500"
};

export function WalletSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['common']);
  const queryClient = useQueryClient();
  const [topupAmount, setTopupAmount] = useState(100000);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'wallet' | 'shetab'>('wallet');
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean;
    message: string;
    discountAmount?: number;
    finalAmount?: number;
    promoCodeId?: number;
  } | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);

  // Fetch wallet data
  const { data: walletData, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/wallet"],
    retry: false,
  });

  // Fetch admin settings
  const { data: adminSettings } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/settings"],
    retry: false,
  });

  // Fetch available courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/courses/available"],
    retry: false,
  });

  // Fetch wallet transactions
  const { data: transactions = [] } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/wallet/transactions"],
    retry: false,
  });

  // Wallet top-up mutation
  const walletTopupMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest("/api/wallet/topup", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount })
      });
    },
    onSuccess: () => {
      toast({
        title: t('toast.paymentSuccessful'),
        description: "کیف پول شما با موفقیت شارژ شد",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: t('toast.paymentError'),
        description: error.message || "مشکلی در فرآیند پرداخت رخ داد",
        variant: "destructive",
      });
    }
  });

  const openEnrollmentDialog = (course: Course, method: 'wallet' | 'shetab') => {
    setPendingPaymentMethod(method);
    setSelectedCourse(course);
    resetPromo();
  };

  const validatePromoCode = async (course: Course) => {
    if (!promoCodeInput.trim()) return;
    setPromoValidating(true);
    try {
      const result = await apiRequest("/api/promo-codes/validate", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput.trim(),
          courseId: course.id,
          amount: course.price,
        }),
      });
      setPromoValidation(result);
    } catch (err: any) {
      setPromoValidation({ valid: false, message: err.message || "کد تخفیف نامعتبر است" });
    } finally {
      setPromoValidating(false);
    }
  };

  const resetPromo = () => {
    setPromoCodeInput("");
    setPromoValidation(null);
  };

  const getEffectivePrice = (originalPrice: number): number => {
    const memberDiscounted = calculateDiscountedPrice(originalPrice);
    if (promoValidation?.valid && promoValidation.finalAmount !== undefined) {
      return promoValidation.finalAmount;
    }
    return memberDiscounted;
  };

  // Course enrollment mutation
  const courseEnrollmentMutation = useMutation({
    mutationFn: async ({ courseId, paymentMethod, promoCode }: { courseId: number; paymentMethod: 'wallet' | 'shetab'; promoCode?: string }) => {
      return await apiRequest("/api/courses/enroll", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId, paymentMethod, promoCode: promoCode || undefined })
      });
    },
    onSuccess: () => {
      toast({
        title: t('toast.enrollmentSuccessful'),
        description: "شما با موفقیت در دوره ثبت نام شدید",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setSelectedCourse(null);
      resetPromo();
    },
    onError: (error: any) => {
      toast({
        title: t('toast.enrollmentError'),
        description: error.message || "مشکلی در فرآیند ثبت نام رخ داد",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!walletData) return originalPrice;
    const discount = walletData.discountPercentage || 0;
    return originalPrice - (originalPrice * discount / 100);
  };

  const incrementTopupAmount = () => {
    const increment = adminSettings?.walletTopupIncrement || 100000;
    setTopupAmount(prev => prev + increment);
  };

  const decrementTopupAmount = () => {
    const increment = adminSettings?.walletTopupIncrement || 100000;
    setTopupAmount(prev => Math.max(increment, prev - increment));
  };

  if (walletLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            کیف پول و عضویت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">موجودی کیف پول</p>
              <p className="text-2xl font-bold">{formatCurrency(walletData?.walletBalance || 0)}</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  شارژ کیف پول
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>شارژ کیف پول</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">مبلغ شارژ</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={decrementTopupAmount}>-</Button>
                      <div className="px-4 py-2 bg-gray-50 rounded text-center font-bold">
                        {formatCurrency(topupAmount)}
                      </div>
                      <Button variant="outline" size="sm" onClick={incrementTopupAmount}>+</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      حداقل مبلغ: {formatCurrency(adminSettings?.walletTopupIncrement || 100000)}
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => walletTopupMutation.mutate(topupAmount)}
                    disabled={walletTopupMutation.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {walletTopupMutation.isPending ? "در حال پردازش..." : "پرداخت از طریق شتاب"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* Member Tier */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">سطح عضویت</p>
              <div className="flex items-center gap-2 mt-1">
                {tierIcons[walletData?.memberTier as keyof typeof tierIcons]}
                <Badge className={`${tierColors[walletData?.memberTier as keyof typeof tierColors]} text-white`}>
                  {walletData?.memberTier === 'bronze' && 'برنزی'}
                  {walletData?.memberTier === 'silver' && 'نقره‌ای'}
                  {walletData?.memberTier === 'gold' && 'طلایی'}
                  {walletData?.memberTier === 'diamond' && 'الماسی'}
                </Badge>
                <span className="text-sm text-green-600 font-medium">
                  {walletData?.discountPercentage}% تخفیف
                </span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">امتیاز کل</p>
              <p className="text-lg font-bold">{(walletData?.totalCredits || 0).toLocaleString('fa-IR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            دوره‌های قابل ثبت نام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {courses.map((course) => {
              const originalPrice = course.price;
              const discountedPrice = calculateDiscountedPrice(originalPrice);
              const savings = originalPrice - discountedPrice;

              return (
                <div key={course.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {course.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {course.weekdays.join(', ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.startTime} - {course.endTime}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      {savings > 0 && (
                        <p className="text-xs text-red-500 line-through">
                          {formatCurrency(originalPrice)}
                        </p>
                      )}
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(discountedPrice)}
                      </p>
                      {savings > 0 && (
                        <p className="text-xs text-green-600">
                          صرفه‌جویی: {formatCurrency(savings)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEnrollmentDialog(course, 'wallet')}
                      disabled={!walletData || walletData.walletBalance < discountedPrice}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      پرداخت از کیف پول
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openEnrollmentDialog(course, 'shetab')}
                      disabled={courseEnrollmentMutation.isPending}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      پرداخت مستقیم
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Course Enrollment Confirmation Dialog */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => { setSelectedCourse(null); resetPromo(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تأیید ثبت نام</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedCourse.title}</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>قیمت اصلی: {formatCurrency(selectedCourse.price)}</p>
                  {(walletData?.discountPercentage || 0) > 0 && (
                    <p>تخفیف عضویت: {walletData?.discountPercentage}%</p>
                  )}
                  {promoValidation?.valid && promoValidation.discountAmount ? (
                    <p className="text-green-600">تخفیف کد: -{formatCurrency(promoValidation.discountAmount)}</p>
                  ) : null}
                  <p className="font-semibold text-green-600">
                    قیمت نهایی: {formatCurrency(getEffectivePrice(selectedCourse.price))}
                  </p>
                  {pendingPaymentMethod === 'wallet' && (
                    <p className={`text-xs ${walletData && walletData.walletBalance >= getEffectivePrice(selectedCourse.price) ? 'text-green-600' : 'text-destructive'}`}>
                      موجودی کیف پول: {formatCurrency(walletData?.walletBalance || 0)}
                    </p>
                  )}
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="space-y-2">
                <Label htmlFor="promo-input" className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  کد تخفیف (اختیاری)
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="promo-input"
                    value={promoCodeInput}
                    onChange={(e) => {
                      setPromoCodeInput(e.target.value.toUpperCase());
                      if (promoValidation) setPromoValidation(null);
                    }}
                    placeholder="مثال: SUMMER30"
                    className="font-mono uppercase"
                    disabled={promoValidation?.valid}
                    dir="ltr"
                  />
                  {promoValidation?.valid ? (
                    <Button type="button" variant="outline" size="sm" onClick={resetPromo} className="shrink-0">
                      <XCircle className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => validatePromoCode(selectedCourse)}
                      disabled={!promoCodeInput.trim() || promoValidating}
                    >
                      {promoValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعمال"}
                    </Button>
                  )}
                </div>
                {promoValidation && (
                  <p className={`text-xs flex items-center gap-1 ${promoValidation.valid ? "text-green-600" : "text-destructive"}`}>
                    {promoValidation.valid
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <XCircle className="h-3.5 w-3.5" />}
                    {promoValidation.message}
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => courseEnrollmentMutation.mutate({ 
                  courseId: selectedCourse.id, 
                  paymentMethod: pendingPaymentMethod,
                  promoCode: promoValidation?.valid && promoCodeInput.trim() ? promoCodeInput.trim() : undefined,
                })}
                disabled={
                  courseEnrollmentMutation.isPending ||
                  (pendingPaymentMethod === 'wallet' && 
                   !!walletData && 
                   walletData.walletBalance < getEffectivePrice(selectedCourse.price))
                }
              >
                {courseEnrollmentMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin me-2" />در حال پردازش...</>
                ) : pendingPaymentMethod === 'wallet' ? (
                  <><Wallet className="h-4 w-4 me-2" />تأیید و پرداخت از کیف پول</>
                ) : (
                  <><CreditCard className="h-4 w-4 me-2" />تأیید و پرداخت از طریق شتاب</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>تاریخچه تراکنش‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                هنوز تراکنشی انجام نشده است
              </p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">
                      {transaction.type === 'topup' && 'شارژ کیف پول'}
                      {transaction.type === 'course_payment' && 'پرداخت دوره'}
                      {transaction.type === 'refund' && 'بازگشت وجه'}
                      {transaction.type === 'admin_adjustment' && 'تعدیل مدیریت'}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${
                      transaction.type === 'topup' ? 'text-green-600' : 
                      transaction.type === 'course_payment' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {transaction.type === 'topup' ? '+' : transaction.type === 'course_payment' ? '-' : ''}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status === 'completed' ? 'موفق' : 
                       transaction.status === 'pending' ? 'در انتظار' : 'ناموفق'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}