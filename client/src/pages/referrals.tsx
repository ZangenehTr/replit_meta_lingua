import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Share2, Copy, Plus, Edit, TrendingUp, Users, Eye, DollarSign, Settings, Link as LinkIcon } from "lucide-react";

interface ReferralLink {
  id: number;
  title: string;
  description: string;
  referralCode: string;
  selfCommissionRate: number;
  referredCommissionRate: number;
  totalClicks: number;
  totalSignups: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: string;
}

interface ReferralStats {
  totalLinks: number;
  totalClicks: number;
  totalSignups: number;
  totalEarnings: number;
  pendingCommissions: number;
  conversionRate: number;
}

interface Commission {
  id: number;
  commissionType: string;
  baseAmount: number;
  commissionAmount: number;
  referrerAmount: number;
  referredAmount: number;
  status: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ReferralLink | null>(null);

  const { data: referralLinks = [], isLoading: linksLoading } = useQuery<ReferralLink[]>({
    queryKey: ["/api/referrals/links"]
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"]
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<Commission[]>({
    queryKey: ["/api/referrals/commissions"]
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      selfCommissionRate: number;
      referredCommissionRate: number;
    }) => {
      return await apiRequest("/api/referrals/links", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/stats"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "لینک معرفی ایجاد شد",
        description: "لینک معرفی جدید با موفقیت ایجاد شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "ایجاد لینک معرفی با خطا مواجه شد",
        variant: "destructive",
      });
    }
  });

  const updateLinkMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      title: string;
      description: string;
      selfCommissionRate: number;
      referredCommissionRate: number;
      isActive: boolean;
    }) => {
      return await apiRequest(`/api/referrals/links/${data.id}`, {
        method: "PUT",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/stats"] });
      setEditingLink(null);
      toast({
        title: "لینک معرفی بروزرسانی شد",
        description: "تغییرات با موفقیت ذخیره شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "بروزرسانی لینک معرفی با خطا مواجه شد",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "کپی شد",
        description: "لینک در کلیپ‌بورد کپی شد",
      });
    } catch (err) {
      toast({
        title: "خطا",
        description: "امکان کپی لینک وجود ندارد",
        variant: "destructive",
      });
    }
  };

  const getReferralUrl = (code: string) => {
    return `${window.location.origin}/signup?ref=${code}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال';
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">سیستم معرفی و کمیسیون</h1>
        <p className="text-muted-foreground">
          لینک‌های معرفی خود را ایجاد کنید و درآمد کسب کنید
        </p>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">تعداد لینک‌ها</p>
                  <p className="text-2xl font-bold">{stats.totalLinks}</p>
                </div>
                <LinkIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">کل کلیک‌ها</p>
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ثبت‌نام‌ها</p>
                  <p className="text-2xl font-bold">{stats.totalSignups}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">کل درآمد</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="links">لینک‌های معرفی</TabsTrigger>
          <TabsTrigger value="commissions">کمیسیون‌ها</TabsTrigger>
          <TabsTrigger value="analytics">آمار تفصیلی</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">لینک‌های معرفی شما</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  ایجاد لینک جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]" dir="rtl">
                <CreateReferralLinkForm
                  onSubmit={(data) => createLinkMutation.mutate(data)}
                  isLoading={createLinkMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {linksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : referralLinks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هنوز لینک معرفی‌ای ندارید</h3>
                  <p className="text-muted-foreground mb-4">
                    اولین لینک معرفی خود را ایجاد کنید و شروع به کسب درآمد کنید
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    ایجاد اولین لینک
                  </Button>
                </CardContent>
              </Card>
            ) : (
              referralLinks.map((link) => (
                <ReferralLinkCard
                  key={link.id}
                  link={link}
                  onEdit={setEditingLink}
                  onCopy={copyToClipboard}
                  getReferralUrl={getReferralUrl}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">تاریخچه کمیسیون‌ها</h2>
            
            {commissionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : commissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">هنوز کمیسیونی دریافت نکرده‌اید</h3>
                  <p className="text-muted-foreground">
                    با معرفی دوستان و دانشجویان جدید، کمیسیون کسب کنید
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {commissions.map((commission) => (
                  <Card key={commission.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={commission.status === 'paid' ? 'default' : 'secondary'}>
                              {commission.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {commission.commissionType === 'payment' ? 'پرداخت دوره' : 'ثبت‌نام'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(commission.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(commission.referrerAmount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            از {formatCurrency(commission.baseAmount)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">آمار تفصیلی</h2>
            
            {!statsLoading && stats && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>نرخ تبدیل</CardTitle>
                    <CardDescription>
                      درصد تبدیل کلیک‌ها به ثبت‌نام
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>نرخ تبدیل</span>
                        <span>%{stats.conversionRate}</span>
                      </div>
                      <Progress value={stats.conversionRate} className="h-2" />
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">کل کلیک‌ها: </span>
                          <span className="font-medium">{stats.totalClicks}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">کل ثبت‌نام‌ها: </span>
                          <span className="font-medium">{stats.totalSignups}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>کمیسیون در انتظار</CardTitle>
                    <CardDescription>
                      مبلغ کمیسیون‌هایی که هنوز پرداخت نشده‌اند
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600">
                      {formatCurrency(stats.pendingCommissions)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingLink && (
        <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
          <DialogContent className="sm:max-w-[600px]" dir="rtl">
            <EditReferralLinkForm
              link={editingLink}
              onSubmit={(data) => updateLinkMutation.mutate({ ...data, id: editingLink.id })}
              isLoading={updateLinkMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateReferralLinkForm({
  onSubmit,
  isLoading
}: {
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selfCommissionRate: 70,
    referredCommissionRate: 30
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selfCommissionRate + formData.referredCommissionRate > 100) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>ایجاد لینک معرفی جدید</DialogTitle>
        <DialogDescription>
          لینک معرفی خود را با تنظیمات کمیسیون دلخواه ایجاد کنید
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">عنوان لینک</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: معرفی دوره زبان انگلیسی"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">توضیحات (اختیاری)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="توضیحات کوتاهی درباره این لینک معرفی..."
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <Label>تقسیم کمیسیون</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selfCommission">سهم شما (%)</Label>
              <Input
                id="selfCommission"
                type="number"
                min="0"
                max="100"
                value={formData.selfCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  selfCommissionRate: parseInt(e.target.value) || 0,
                  referredCommissionRate: Math.max(0, 100 - (parseInt(e.target.value) || 0))
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referredCommission">سهم معرفی شده (%)</Label>
              <Input
                id="referredCommission"
                type="number"
                min="0"
                max="100"
                value={formData.referredCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  referredCommissionRate: parseInt(e.target.value) || 0,
                  selfCommissionRate: Math.max(0, 100 - (parseInt(e.target.value) || 0))
                })}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>توضیح:</strong> از هر پرداختی که از طریق این لینک انجام شود، 
              %{formData.selfCommissionRate} به کیف پول شما و %{formData.referredCommissionRate} به 
              کیف پول کاربر معرفی شده اضافه می‌شود.
            </p>
          </div>
          
          {formData.selfCommissionRate + formData.referredCommissionRate > 100 && (
            <p className="text-sm text-red-600">
              مجموع درصدها نمی‌تواند بیش از 100% باشد
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isLoading || formData.selfCommissionRate + formData.referredCommissionRate > 100}>
            {isLoading ? "در حال ایجاد..." : "ایجاد لینک"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function EditReferralLinkForm({
  link,
  onSubmit,
  isLoading
}: {
  link: ReferralLink;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: link.title,
    description: link.description,
    selfCommissionRate: link.selfCommissionRate,
    referredCommissionRate: link.referredCommissionRate,
    isActive: link.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selfCommissionRate + formData.referredCommissionRate > 100) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>ویرایش لینک معرفی</DialogTitle>
        <DialogDescription>
          تنظیمات لینک معرفی خود را ویرایش کنید
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">عنوان لینک</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">توضیحات</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <Label>تقسیم کمیسیون</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="selfCommission">سهم شما (%)</Label>
              <Input
                id="selfCommission"
                type="number"
                min="0"
                max="100"
                value={formData.selfCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  selfCommissionRate: parseInt(e.target.value) || 0,
                  referredCommissionRate: Math.max(0, 100 - (parseInt(e.target.value) || 0))
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="referredCommission">سهم معرفی شده (%)</Label>
              <Input
                id="referredCommission"
                type="number"
                min="0"
                max="100"
                value={formData.referredCommissionRate}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  referredCommissionRate: parseInt(e.target.value) || 0,
                  selfCommissionRate: Math.max(0, 100 - (parseInt(e.target.value) || 0))
                })}
              />
            </div>
          </div>
          
          {formData.selfCommissionRate + formData.referredCommissionRate > 100 && (
            <p className="text-sm text-red-600">
              مجموع درصدها نمی‌تواند بیش از 100% باشد
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="isActive">فعال</Label>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isLoading || formData.selfCommissionRate + formData.referredCommissionRate > 100}>
            {isLoading ? "در حال بروزرسانی..." : "بروزرسانی"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function ReferralLinkCard({
  link,
  onEdit,
  onCopy,
  getReferralUrl
}: {
  link: ReferralLink;
  onEdit: (link: ReferralLink) => void;
  onCopy: (text: string) => void;
  getReferralUrl: (code: string) => string;
}) {
  const referralUrl = getReferralUrl(link.referralCode);
  const conversionRate = link.totalClicks > 0 ? (link.totalSignups / link.totalClicks) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {link.title}
              <Badge variant={link.isActive ? "default" : "secondary"}>
                {link.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </CardTitle>
            {link.description && (
              <CardDescription className="mt-2">{link.description}</CardDescription>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onEdit(link)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>لینک معرفی</Label>
          <div className="flex gap-2">
            <Input value={referralUrl} readOnly className="font-mono text-sm" />
            <Button size="sm" variant="outline" onClick={() => onCopy(referralUrl)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">کد معرفی: {link.referralCode}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">سهم شما</p>
            <p className="text-lg font-semibold text-green-600">%{link.selfCommissionRate}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">سهم معرفی شده</p>
            <p className="text-lg font-semibold text-blue-600">%{link.referredCommissionRate}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">{link.totalClicks}</p>
            <p className="text-xs text-muted-foreground">کلیک</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{link.totalSignups}</p>
            <p className="text-xs text-muted-foreground">ثبت‌نام</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">تبدیل</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('fa-IR').format(link.totalEarnings)}
            </p>
            <p className="text-xs text-muted-foreground">درآمد</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}