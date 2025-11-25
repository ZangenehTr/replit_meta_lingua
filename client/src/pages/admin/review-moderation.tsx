import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, 
  Check, 
  X, 
  Clock,
  MessageSquare,
  User,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";

interface Review {
  id: number;
  teacherId: number;
  studentId: number;
  rating: number;
  reviewText: string;
  reviewTextFa?: string;
  reviewTextAr?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isAnonymous: boolean;
  createdAt: string;
  approvedAt?: string;
  studentFirstName?: string;
  studentLastName?: string;
}

export default function ReviewModerationPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const { language: currentLanguage, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const getLocalizedText = (en: string, fa: string, ar?: string) => {
    if (currentLanguage === 'fa') return fa;
    if (currentLanguage === 'ar') return ar || fa;
    return en;
  };

  const { data: reviews = [], isLoading, refetch } = useQuery<Review[]>({
    queryKey: ['/api/admin/reviews', { status: selectedStatus }],
    queryFn: async () => {
      const url = selectedStatus 
        ? `/api/admin/reviews?status=${selectedStatus}`
        : '/api/admin/reviews';
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    }
  });

  const updateReviewStatus = useMutation({
    mutationFn: async ({ reviewId, status, rejectionReason }: { 
      reviewId: number; 
      status: 'approved' | 'rejected';
      rejectionReason?: string;
    }) => {
      return apiRequest(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason })
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({
        title: variables.status === 'approved' 
          ? getLocalizedText('Review Approved', 'نظر تأیید شد', 'تمت الموافقة على المراجعة')
          : getLocalizedText('Review Rejected', 'نظر رد شد', 'تم رفض المراجعة'),
        description: variables.status === 'approved'
          ? getLocalizedText('The review is now visible to the public.', 'نظر اکنون برای عموم قابل مشاهده است.', 'المراجعة مرئية الآن للجمهور.')
          : getLocalizedText('The review has been rejected.', 'نظر رد شده است.', 'تم رفض المراجعة.')
      });
      setRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedReview(null);
    },
    onError: () => {
      toast({
        title: getLocalizedText('Error', 'خطا', 'خطأ'),
        description: getLocalizedText('Failed to update review status.', 'به‌روزرسانی وضعیت نظر با خطا مواجه شد.', 'فشل في تحديث حالة المراجعة.'),
        variant: 'destructive'
      });
    }
  });

  const handleApprove = (review: Review) => {
    updateReviewStatus.mutate({
      reviewId: review.id,
      status: 'approved'
    });
  };

  const handleReject = () => {
    if (!selectedReview) return;
    
    updateReviewStatus.mutate({
      reviewId: selectedReview.id,
      status: 'rejected',
      rejectionReason
    });
  };

  const openRejectionDialog = (review: Review) => {
    setSelectedReview(review);
    setRejectionDialogOpen(true);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: 'secondary', label: getLocalizedText('Pending', 'در انتظار', 'قيد الانتظار') },
      approved: { variant: 'default', label: getLocalizedText('Approved', 'تأیید شده', 'موافق عليه') },
      rejected: { variant: 'destructive', label: getLocalizedText('Rejected', 'رد شده', 'مرفوض') }
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <AppLayout>
      <div className={`p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {getLocalizedText('Review Moderation', 'مدیریت نظرات', 'إدارة المراجعات')}
            </h1>
            <p className="text-gray-500">
              {getLocalizedText(
                'Approve or reject teacher reviews before they are published',
                'نظرات معلمان را قبل از انتشار تأیید یا رد کنید',
                'الموافقة على مراجعات المعلمين أو رفضها قبل نشرها'
              )}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {getLocalizedText('Refresh', 'بازخوانی', 'تحديث')}
          </Button>
        </div>

        {pendingCount > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">
                  {pendingCount} {getLocalizedText('reviews pending approval', 'نظر در انتظار تأیید', 'مراجعات في انتظار الموافقة')}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              {getLocalizedText('Pending', 'در انتظار', 'قيد الانتظار')}
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              <Check className="h-4 w-4 mr-2" />
              {getLocalizedText('Approved', 'تأیید شده', 'موافق عليه')}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <X className="h-4 w-4 mr-2" />
              {getLocalizedText('Rejected', 'رد شده', 'مرفوض')}
            </TabsTrigger>
            <TabsTrigger value="">
              <Filter className="h-4 w-4 mr-2" />
              {getLocalizedText('All', 'همه', 'الكل')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">{getLocalizedText('Loading...', 'در حال بارگذاری...', 'جاري التحميل...')}</p>
              </div>
            ) : reviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {getLocalizedText('No reviews found', 'نظری یافت نشد', 'لم يتم العثور على مراجعات')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {review.isAnonymous ? '?' : `${review.studentFirstName?.[0] || ''}${review.studentLastName?.[0] || ''}`}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {review.isAnonymous 
                                  ? getLocalizedText('Anonymous', 'ناشناس', 'مجهول')
                                  : `${review.studentFirstName || ''} ${review.studentLastName || ''}`.trim() || getLocalizedText('Student', 'دانش‌آموز', 'طالب')}
                              </span>
                              {renderStars(review.rating)}
                              {getStatusBadge(review.status)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                currentLanguage === 'fa' ? 'fa-IR' : 
                                currentLanguage === 'ar' ? 'ar' : 'en-US'
                              )}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-500 mb-2">
                            <User className="h-3 w-3 inline mr-1" />
                            {getLocalizedText('For Teacher ID:', 'برای معلم با شناسه:', 'للمعلم رقم:')} {review.teacherId}
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {currentLanguage === 'fa' && review.reviewTextFa 
                              ? review.reviewTextFa 
                              : currentLanguage === 'ar' && review.reviewTextAr
                                ? review.reviewTextAr
                                : review.reviewText || getLocalizedText('No text provided', 'متنی ارائه نشده', 'لم يتم تقديم نص')}
                          </p>

                          {review.rejectionReason && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded p-3 mb-4">
                              <p className="text-sm text-red-600 dark:text-red-400">
                                <strong>{getLocalizedText('Rejection Reason:', 'دلیل رد:', 'سبب الرفض:')}</strong> {review.rejectionReason}
                              </p>
                            </div>
                          )}
                          
                          {review.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(review)}
                                disabled={updateReviewStatus.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                {getLocalizedText('Approve', 'تأیید', 'موافقة')}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => openRejectionDialog(review)}
                                disabled={updateReviewStatus.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                {getLocalizedText('Reject', 'رد', 'رفض')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {getLocalizedText('Reject Review', 'رد نظر', 'رفض المراجعة')}
              </DialogTitle>
              <DialogDescription>
                {getLocalizedText(
                  'Please provide a reason for rejecting this review. This will be recorded but not shown to the student.',
                  'لطفاً دلیل رد این نظر را ارائه دهید. این دلیل ثبت می‌شود اما به دانش‌آموز نشان داده نمی‌شود.',
                  'يرجى تقديم سبب لرفض هذه المراجعة. سيتم تسجيل هذا ولكن لن يظهر للطالب.'
                )}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={getLocalizedText(
                'Enter rejection reason...',
                'دلیل رد را وارد کنید...',
                'أدخل سبب الرفض...'
              )}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
                {getLocalizedText('Cancel', 'لغو', 'إلغاء')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={updateReviewStatus.isPending}
              >
                {getLocalizedText('Confirm Rejection', 'تأیید رد', 'تأكيد الرفض')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
