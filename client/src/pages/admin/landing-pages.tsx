import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Save,
  Edit2,
  Globe,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface LandingPage {
  id: number;
  slug: string;
  programName: string;
  heroTitle: string;
  heroSubtitle: string | null;
  heroCtaPrimary: string | null;
  heroCtaSecondary: string | null;
  targetAudienceBullets: string[];
  examTipsHtml: string | null;
  testimonials: Array<{ quote: string; studentName: string; score: string; examType: string }>;
  faqItems: Array<{ q: string; a: string }>;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  featureBullets: string[];
  isPublished: boolean;
}

const PROGRAM_ICONS: Record<string, string> = {
  ielts: '🎯',
  toefl: '📚',
  gre: '🧠',
  pte: '💻',
  conversation: '🗣️'
};

export default function AdminLandingPages() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<LandingPage> | null>(null);

  const { data: pages = [], isLoading } = useQuery<LandingPage[]>({
    queryKey: ['/api/admin/landing-pages']
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { slug: string; updates: Partial<LandingPage> }) => {
      const res = await apiRequest('PUT', `/api/admin/landing-pages/${data.slug}`, data.updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/landing-pages'] });
      toast({ title: 'ذخیره شد', description: 'محتوای صفحه با موفقیت ذخیره شد' });
    },
    onError: () => {
      toast({ title: 'خطا', description: 'ذخیره‌سازی انجام نشد', variant: 'destructive' });
    }
  });

  const handleEdit = (page: LandingPage) => {
    setSelectedSlug(page.slug);
    setEditData({ ...page });
  };

  const handleSave = () => {
    if (!selectedSlug || !editData) return;
    updateMutation.mutate({ slug: selectedSlug, updates: editData });
  };

  const updateField = (field: keyof LandingPage, value: any) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateBullet = (field: 'targetAudienceBullets' | 'featureBullets', index: number, value: string) => {
    if (!editData) return;
    const arr = [...(editData[field] as string[] || [])];
    arr[index] = value;
    updateField(field, arr);
  };

  const addBullet = (field: 'targetAudienceBullets' | 'featureBullets') => {
    if (!editData) return;
    updateField(field, [...(editData[field] as string[] || []), '']);
  };

  const removeBullet = (field: 'targetAudienceBullets' | 'featureBullets', index: number) => {
    if (!editData) return;
    const arr = [...(editData[field] as string[] || [])];
    arr.splice(index, 1);
    updateField(field, arr);
  };

  const updateTestimonial = (index: number, key: string, value: string) => {
    if (!editData) return;
    const arr = [...(editData.testimonials || [])];
    arr[index] = { ...arr[index], [key]: value };
    updateField('testimonials', arr);
  };

  const addTestimonial = () => {
    if (!editData) return;
    updateField('testimonials', [...(editData.testimonials || []), { quote: '', studentName: '', score: '', examType: '' }]);
  };

  const removeTestimonial = (index: number) => {
    if (!editData) return;
    const arr = [...(editData.testimonials || [])];
    arr.splice(index, 1);
    updateField('testimonials', arr);
  };

  const updateFaq = (index: number, key: string, value: string) => {
    if (!editData) return;
    const arr = [...(editData.faqItems || [])];
    arr[index] = { ...arr[index], [key]: value };
    updateField('faqItems', arr);
  };

  const addFaq = () => {
    if (!editData) return;
    updateField('faqItems', [...(editData.faqItems || []), { q: '', a: '' }]);
  };

  const removeFaq = (index: number) => {
    if (!editData) return;
    const arr = [...(editData.faqItems || [])];
    arr.splice(index, 1);
    updateField('faqItems', arr);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Landing Pages Editor
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Edit Farsi content for all 5 course program landing pages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Page list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Programs</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {pages.map(page => (
                  <button
                    key={page.slug}
                    onClick={() => handleEdit(page)}
                    className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
                      selectedSlug === page.slug
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{PROGRAM_ICONS[page.slug] || '📄'}</span>
                        <div>
                          <div className="font-semibold text-sm">{page.programName}</div>
                          <div className={`text-xs ${selectedSlug === page.slug ? 'text-white/70' : 'text-gray-400'}`}>
                            /courses/{page.slug}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={page.isPublished ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {page.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main: Editor */}
          <div className="lg:col-span-3">
            {!editData ? (
              <Card className="h-64 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Edit2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>Select a program to edit its landing page content</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Publish toggle + Save + Preview */}
                <div className="flex items-center justify-between bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={editData.isPublished || false}
                      onCheckedChange={val => updateField('isPublished', val)}
                    />
                    <span className="text-sm font-medium">
                      {editData.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/courses/${selectedSlug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        Preview
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-1"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="hero">
                  <TabsList className="flex flex-wrap gap-1 h-auto">
                    <TabsTrigger value="hero">Hero</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                    <TabsTrigger value="tips">Exam Tips</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>

                  {/* HERO TAB */}
                  <TabsContent value="hero">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hero Section</CardTitle>
                        <CardDescription>Main headline and CTA buttons (Farsi)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4" dir="rtl">
                        <div>
                          <Label>Program Name</Label>
                          <Input
                            value={editData.programName || ''}
                            onChange={e => updateField('programName', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Hero Title (Farsi)</Label>
                          <Input
                            value={editData.heroTitle || ''}
                            onChange={e => updateField('heroTitle', e.target.value)}
                            className="mt-1 text-right"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <Label>Hero Subtitle (Farsi)</Label>
                          <Textarea
                            value={editData.heroSubtitle || ''}
                            onChange={e => updateField('heroSubtitle', e.target.value)}
                            className="mt-1 text-right"
                            dir="rtl"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Primary CTA Button</Label>
                            <Input
                              value={editData.heroCtaPrimary || ''}
                              onChange={e => updateField('heroCtaPrimary', e.target.value)}
                              className="mt-1 text-right"
                              dir="rtl"
                              placeholder="ثبت‌نام"
                            />
                          </div>
                          <div>
                            <Label>Secondary CTA Button</Label>
                            <Input
                              value={editData.heroCtaSecondary || ''}
                              onChange={e => updateField('heroCtaSecondary', e.target.value)}
                              className="mt-1 text-right"
                              dir="rtl"
                              placeholder="Placement رایگان"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AUDIENCE TAB */}
                  <TabsContent value="audience">
                    <Card>
                      <CardHeader>
                        <CardTitle>Target Audience Bullets</CardTitle>
                        <CardDescription>"این دوره برای چه کسانی مناسبه؟" section</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3" dir="rtl">
                        {(editData.targetAudienceBullets || []).map((b, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                            <Input
                              value={b}
                              onChange={e => updateBullet('targetAudienceBullets', i, e.target.value)}
                              className="text-right flex-1"
                              dir="rtl"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBullet('targetAudienceBullets', i)}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBullet('targetAudienceBullets')}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Bullet
                        </Button>

                        <div className="pt-4 border-t">
                          <Label>Feature Bullets (Course highlights)</Label>
                          <div className="mt-2 space-y-2">
                            {(editData.featureBullets || []).map((b, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Input
                                  value={b}
                                  onChange={e => updateBullet('featureBullets', i, e.target.value)}
                                  className="text-right flex-1"
                                  dir="rtl"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeBullet('featureBullets', i)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addBullet('featureBullets')}
                              className="flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              Add Feature
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TESTIMONIALS TAB */}
                  <TabsContent value="testimonials">
                    <Card>
                      <CardHeader>
                        <CardTitle>Testimonials</CardTitle>
                        <CardDescription>Score-based student quotes (min 3)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(editData.testimonials || []).map((t, i) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-600">Testimonial #{i + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeTestimonial(i)}>
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                            <div dir="rtl">
                              <Label>Quote (Farsi)</Label>
                              <Textarea
                                value={t.quote}
                                onChange={e => updateTestimonial(i, 'quote', e.target.value)}
                                className="mt-1 text-right"
                                rows={2}
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label>Student Name</Label>
                                <Input
                                  value={t.studentName}
                                  onChange={e => updateTestimonial(i, 'studentName', e.target.value)}
                                  className="mt-1"
                                  dir="rtl"
                                  placeholder="سارا م."
                                />
                              </div>
                              <div>
                                <Label>Score</Label>
                                <Input
                                  value={t.score}
                                  onChange={e => updateTestimonial(i, 'score', e.target.value)}
                                  className="mt-1"
                                  placeholder="Band 7.5"
                                />
                              </div>
                              <div>
                                <Label>Exam Type</Label>
                                <Input
                                  value={t.examType}
                                  onChange={e => updateTestimonial(i, 'examType', e.target.value)}
                                  className="mt-1"
                                  placeholder="IELTS Academic"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addTestimonial}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Testimonial
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* FAQ TAB */}
                  <TabsContent value="faq">
                    <Card>
                      <CardHeader>
                        <CardTitle>FAQ Items</CardTitle>
                        <CardDescription>Expandable Q&A (4–6 questions recommended)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(editData.faqItems || []).map((item, i) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-xl border space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-600">FAQ #{i + 1}</span>
                              <Button variant="ghost" size="sm" onClick={() => removeFaq(i)}>
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                            <div dir="rtl">
                              <Label>Question (Farsi)</Label>
                              <Input
                                value={item.q}
                                onChange={e => updateFaq(i, 'q', e.target.value)}
                                className="mt-1 text-right"
                              />
                            </div>
                            <div dir="rtl">
                              <Label>Answer (Farsi)</Label>
                              <Textarea
                                value={item.a}
                                onChange={e => updateFaq(i, 'a', e.target.value)}
                                className="mt-1 text-right"
                                rows={3}
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={addFaq}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add FAQ
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* EXAM TIPS TAB */}
                  <TabsContent value="tips">
                    <Card>
                      <CardHeader>
                        <CardTitle>Exam Tips (HTML)</CardTitle>
                        <CardDescription>HTML content for "چطور این آزمون رو بزنی؟" section</CardDescription>
                      </CardHeader>
                      <CardContent dir="rtl">
                        <Textarea
                          value={editData.examTipsHtml || ''}
                          onChange={e => updateField('examTipsHtml', e.target.value)}
                          className="font-mono text-sm text-left"
                          dir="ltr"
                          rows={12}
                          placeholder="<ul><li><strong>Speaking:</strong> ...</li></ul>"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Use HTML: &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* SEO TAB */}
                  <TabsContent value="seo">
                    <Card>
                      <CardHeader>
                        <CardTitle>SEO & Meta Tags</CardTitle>
                        <CardDescription>Search engine optimization fields (Farsi)</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4" dir="rtl">
                        <div>
                          <Label>SEO Title</Label>
                          <Input
                            value={editData.seoTitle || ''}
                            onChange={e => updateField('seoTitle', e.target.value)}
                            className="mt-1"
                            dir="rtl"
                            placeholder="بهترین کلاس آیلتس آنلاین | MetaLingo"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {(editData.seoTitle || '').length}/60 chars
                          </p>
                        </div>
                        <div>
                          <Label>SEO Description</Label>
                          <Textarea
                            value={editData.seoDescription || ''}
                            onChange={e => updateField('seoDescription', e.target.value)}
                            className="mt-1"
                            dir="rtl"
                            rows={3}
                            placeholder="آموزش آیلتس آنلاین با استادهای مجرب..."
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            {(editData.seoDescription || '').length}/160 chars
                          </p>
                        </div>
                        <div>
                          <Label>SEO Keywords (comma-separated, Farsi)</Label>
                          <Input
                            value={(editData.seoKeywords || []).join('، ')}
                            onChange={e => updateField('seoKeywords', e.target.value.split('، ').map(k => k.trim()).filter(Boolean))}
                            className="mt-1"
                            dir="rtl"
                            placeholder="آموزش آیلتس، کلاس آیلتس خصوصی"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Bottom Save */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save All Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
