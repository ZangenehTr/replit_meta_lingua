import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  Search,
  Globe,
  Folder,
  Calendar,
  CheckCircle,
  XCircle,
  History,
  Sparkles,
  BarChart3,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { CmsBlogPost, InsertCmsBlogPost, CmsBlogCategory, CmsBlogTag } from '@shared/schema';
import { FileUploadWidget } from '@/components/forms/widgets/FileUploadWidget';
import { RichTextWidget } from '@/components/forms/widgets/RichTextWidget';

interface AIGenerationJobSummary {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  avgGenerationTimeMs: number;
}

interface AIGenerationJob {
  id: number;
  status: string;
  sourceType: string;
  model: string | null;
  createdAt: string;
}

interface GenerationJobsData {
  summary: AIGenerationJobSummary;
  jobs: AIGenerationJob[];
}

interface PromptTemplate {
  id: number;
  name: string;
  contentType: string;
}

interface ContentVersion {
  id: number;
  versionNumber: number;
  title: string;
  status: string;
  excerpt: string | null;
  content: string;
  changeNote: string | null;
  createdAt: string;
}

interface AvailableSources {
  trends: Array<{ id: number; trendName: string }>;
  competitorPriceItems: Array<{ id: number; courseName: string; competitorName: string }>;
}

export default function BlogManagement() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CmsBlogPost | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocale, setFilterLocale] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [versionHistoryPostId, setVersionHistoryPostId] = useState<number | null>(null);
  const [approvingPostId, setApprovingPostId] = useState<number | null>(null);
  const [diffVersionA, setDiffVersionA] = useState<number | null>(null);

  const { data: blogPosts = [], isLoading: isLoadingPosts } = useQuery<CmsBlogPost[]>({
    queryKey: ['/api/cms/blog/posts', filterStatus, filterLocale, filterCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterLocale !== 'all') params.append('locale', filterLocale);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      const query = params.toString();
      return apiRequest(`/api/cms/blog/posts${query ? '?' + query : ''}`, { method: 'GET' });
    }
  });

  const { data: categories = [] } = useQuery<CmsBlogCategory[]>({
    queryKey: ['/api/cms/blog/categories'],
  });

  const { data: tags = [] } = useQuery<CmsBlogTag[]>({
    queryKey: ['/api/cms/blog/tags'],
  });

  const { data: generationJobsData, refetch: refetchJobs } = useQuery<GenerationJobsData>({
    queryKey: ['/api/admin/content/generation-jobs'],
    queryFn: () => apiRequest('/api/admin/content/generation-jobs', { method: 'GET' }),
    refetchInterval: 30000,
  });

  const { data: templates = [] } = useQuery<PromptTemplate[]>({
    queryKey: ['/api/admin/content/templates'],
    queryFn: () => apiRequest('/api/admin/content/templates', { method: 'GET' }),
  });

  const { data: versionHistory = [] } = useQuery<ContentVersion[]>({
    queryKey: ['/api/cms/blog/posts', versionHistoryPostId, 'versions'],
    queryFn: (): Promise<ContentVersion[]> => versionHistoryPostId
      ? apiRequest(`/api/cms/blog/posts/${versionHistoryPostId}/versions`, { method: 'GET' })
      : Promise.resolve([]),
    enabled: !!versionHistoryPostId,
  });

  const isAdmin = user?.role === 'Admin';

  const { data: supervisorPolicy, refetch: refetchPolicy } = useQuery<{ supervisorRequiresAdminSignoff: boolean }>({
    queryKey: ['/api/admin/cms/policy/supervisor-signoff'],
    queryFn: () => apiRequest('/api/admin/cms/policy/supervisor-signoff', { method: 'GET' }),
    enabled: isAdmin,
  });

  const updatePolicyMutation = useMutation({
    mutationFn: (value: boolean) => apiRequest('/api/admin/cms/policy/supervisor-signoff', {
      method: 'PUT',
      body: { supervisorRequiresAdminSignoff: value },
    }),
    onSuccess: () => {
      refetchPolicy();
      toast({ title: 'Policy Updated', description: 'Supervisor sign-off policy has been updated.' });
    },
  });

  interface VersionDiff {
    postId: number;
    versionA: number;
    versionB: number | string;
    changesCount: number;
    changes: Array<{ field: string; from: unknown; to: unknown }>;
    versionAMeta: { versionNumber: number; changeNote: string; createdAt: string };
  }

  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [isDiffLoading, setIsDiffLoading] = useState(false);

  const fetchVersionDiff = useCallback(async (postId: number, vA: number, vB?: number) => {
    setIsDiffLoading(true);
    setVersionDiff(null);
    try {
      const url = `/api/cms/blog/posts/${postId}/versions/diff?a=${vA}${vB != null ? `&b=${vB}` : ''}`;
      const result = await apiRequest(url, { method: 'GET' });
      setVersionDiff(result as VersionDiff);
    } catch {
      toast({ title: 'Error', description: 'Failed to load version diff.', variant: 'destructive' });
    } finally {
      setIsDiffLoading(false);
    }
  }, [toast]);

  const createPostMutation = useMutation({
    mutationFn: async (postData: Partial<InsertCmsBlogPost>) => {
      return apiRequest('/api/cms/blog/posts', { method: 'POST', body: postData });
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Created', description: 'The blog post has been created successfully.' });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create blog post. Please try again.', variant: 'destructive' });
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CmsBlogPost> }) => {
      return apiRequest(`/api/cms/blog/posts/${id}`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Updated', description: 'The blog post has been updated successfully.' });
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update blog post. Please try again.', variant: 'destructive' });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/blog/posts/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: 'Blog Post Deleted', description: 'The blog post has been deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete blog post. Please try again.', variant: 'destructive' });
    }
  });

  const approvePostMutation = useMutation({
    mutationFn: async ({ id, forceDuplicate = false, scheduledAt }: { id: number; forceDuplicate?: boolean; scheduledAt?: string }) => {
      return apiRequest(`/api/cms/blog/posts/${id}/approve`, {
        method: 'POST',
        body: { publishImmediately: !scheduledAt, scheduledAt, forceDuplicate }
      });
    },
    onSuccess: () => {
      toast({ title: 'Post Approved', description: 'The post has been approved. Check status for next steps.' });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: (error: Error) => {
      if (error.message?.includes('409') || error.message?.includes('duplicate')) {
        toast({ title: 'Duplicate Detected', description: 'Similar content exists. Use force approve to override.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to approve post.', variant: 'destructive' });
      }
    }
  });

  const rejectPostMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return apiRequest(`/api/cms/blog/posts/${id}/reject`, {
        method: 'POST',
        body: { reason }
      });
    },
    onSuccess: () => {
      toast({ title: 'Post Rejected', description: 'The post has been rejected.' });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to reject post.', variant: 'destructive' });
    }
  });

  const handlePublishToggle = (post: CmsBlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, status: newStatus, publishedAt: newStatus === 'published' ? new Date() : (post.publishedAt ?? null) }
    });
  };

  const filteredPosts = blogPosts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query)
    );
  });

  const summary = generationJobsData?.summary;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage blog posts for your CMS</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAIGenerateOpen(true)} data-testid="button-ai-generate">
              <Sparkles className="w-4 h-4 me-2" />
              AI Generate
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-post">
              <Plus className="w-4 h-4 me-2" />
              Create Post
            </Button>
          </div>
        </div>

        {summary && (
          <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                AI Content Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">{summary.queued}</p>
                  <p className="text-xs text-muted-foreground">Queued</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">{summary.processing}</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">{summary.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-700">{summary.failed}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {summary.avgGenerationTimeMs > 0 ? `${(summary.avgGenerationTimeMs / 1000).toFixed(1)}s` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Time</p>
                </div>
              </div>
              {generationJobsData?.jobs && generationJobsData.jobs.length > 0 && (
                <div className="mt-4 space-y-1 max-h-32 overflow-y-auto">
                  {generationJobsData.jobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                        {job.status}
                      </Badge>
                      <span>{job.sourceType} → {job.model ?? 'pending'}</span>
                      <span className="ml-auto">{new Date(job.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => refetchJobs()}>
                <RefreshCw className="w-3 h-3 me-1" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
            <CardDescription>Filter blog posts by status, language, and category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search-posts">Search</Label>
                <div className="relative">
                  <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-posts"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-8"
                    data-testid="input-search-posts"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-status">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="filter-status" data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-locale">Language</Label>
                <Select value={filterLocale} onValueChange={setFilterLocale}>
                  <SelectTrigger id="filter-locale" data-testid="select-filter-locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fa">Persian</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-category">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger id="filter-category" data-testid="select-filter-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {isLoadingPosts ? (
            <Card><CardContent className="p-6"><p className="text-muted-foreground">Loading blog posts...</p></CardContent></Card>
          ) : filteredPosts.length === 0 ? (
            <Card><CardContent className="p-6"><p className="text-muted-foreground">No blog posts found. Create your first post to get started!</p></CardContent></Card>
          ) : (
            filteredPosts.map(post => (
              <BlogPostCard
                key={post.id}
                post={post}
                categories={categories}
                onEdit={() => setEditingPost(post)}
                onPublishToggle={() => handlePublishToggle(post)}
                onApprove={() => setApprovingPostId(post.id)}
                onReject={() => {
                  const reason = prompt('Rejection reason (optional):') ?? '';
                  rejectPostMutation.mutate({ id: post.id, reason });
                }}
                onViewHistory={() => setVersionHistoryPostId(post.id)}
                onDelete={() => {
                  if (confirm('Are you sure you want to delete this post?')) {
                    deletePostMutation.mutate(post.id);
                  }
                }}
              />
            ))
          )}
        </div>

        <BlogPostEditorDialog
          open={isCreateDialogOpen || !!editingPost}
          onOpenChange={(open) => {
            if (!open) { setIsCreateDialogOpen(false); setEditingPost(null); }
          }}
          post={editingPost}
          categories={categories}
          tags={tags}
          onSave={(data) => {
            if (editingPost) {
              updatePostMutation.mutate({ id: editingPost.id, data });
            } else {
              createPostMutation.mutate({ ...data, authorId: user?.id });
            }
          }}
        />

        <AIGenerateDialog
          open={isAIGenerateOpen}
          onOpenChange={setIsAIGenerateOpen}
          templates={templates}
          onSuccess={() => {
            setIsAIGenerateOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
            refetchJobs();
            toast({ title: 'Generation Queued', description: 'Your AI content is being generated. It will appear in the draft queue shortly.' });
          }}
        />

        {/* Approve & Schedule Dialog */}
        <ApproveDialog
          postId={approvingPostId}
          isAdmin={isAdmin}
          open={approvingPostId !== null}
          onOpenChange={(open) => { if (!open) setApprovingPostId(null); }}
          onApprove={(params) => {
            if (approvingPostId !== null) {
              approvePostMutation.mutate({ id: approvingPostId, ...params }, {
                onSuccess: () => setApprovingPostId(null),
              });
            }
          }}
        />

        {/* Version History Sheet with Diff */}
        <Sheet open={!!versionHistoryPostId} onOpenChange={(open) => {
          if (!open) {
            setVersionHistoryPostId(null);
            setVersionDiff(null);
            setDiffVersionA(null);
          }
        }}>
          <SheetContent className="w-[560px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Version History
              </SheetTitle>
              <SheetDescription>
                Previous snapshots — select a version to compare with current
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {versionHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No version history available.</p>
              ) : (
                <>
                  {versionHistory.map((version) => (
                    <Card key={version.id} className={diffVersionA === version.versionNumber ? 'border-blue-400' : ''}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">v{version.versionNumber}</Badge>
                            {diffVersionA === version.versionNumber && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">Comparing from</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{version.title}</p>
                        <p className="text-xs text-muted-foreground">Status: {version.status}</p>
                        {version.changeNote && (
                          <p className="text-xs text-blue-600 italic">{version.changeNote}</p>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {version.excerpt ?? version.content.slice(0, 120)}
                        </p>
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setDiffVersionA(version.versionNumber);
                              setVersionDiff(null);
                            }}
                          >
                            Select as Base
                          </Button>
                          {diffVersionA !== null && diffVersionA !== version.versionNumber && versionHistoryPostId !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-blue-700 border-blue-300"
                              onClick={() => fetchVersionDiff(versionHistoryPostId, diffVersionA, version.versionNumber)}
                            >
                              Compare with v{version.versionNumber}
                            </Button>
                          )}
                          {diffVersionA !== null && versionHistoryPostId !== null && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-green-700 border-green-300"
                              onClick={() => fetchVersionDiff(versionHistoryPostId, version.versionNumber)}
                            >
                              Diff vs Current
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Diff result panel */}
                  {(isDiffLoading || versionDiff) && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        {isDiffLoading ? (
                          <p className="text-sm text-muted-foreground">Loading diff...</p>
                        ) : versionDiff && (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-medium">
                                v{versionDiff.versionA} → {typeof versionDiff.versionB === 'number' ? `v${versionDiff.versionB}` : 'current'}
                              </p>
                              <Badge variant="outline">{versionDiff.changesCount} change{versionDiff.changesCount !== 1 ? 's' : ''}</Badge>
                            </div>
                            {versionDiff.changesCount === 0 ? (
                              <p className="text-xs text-muted-foreground">No differences found.</p>
                            ) : (
                              <div className="space-y-2">
                                {versionDiff.changes.map((change) => (
                                  <div key={change.field} className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{change.field}</p>
                                    <div className="rounded bg-red-50 border border-red-200 px-2 py-1 text-xs text-red-700 line-clamp-2">
                                      − {String(change.from).slice(0, 200)}
                                    </div>
                                    <div className="rounded bg-green-50 border border-green-200 px-2 py-1 text-xs text-green-700 line-clamp-2">
                                      + {String(change.to).slice(0, 200)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Admin: Supervisor sign-off policy toggle */}
            {isAdmin && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-medium mb-2">Supervisor Publish Policy</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex-1">
                    {supervisorPolicy?.supervisorRequiresAdminSignoff
                      ? 'Supervisor approval requires Admin final sign-off before publishing.'
                      : 'Supervisors can publish directly without Admin sign-off.'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => updatePolicyMutation.mutate(!(supervisorPolicy?.supervisorRequiresAdminSignoff ?? true))}
                  >
                    {supervisorPolicy?.supervisorRequiresAdminSignoff ? 'Allow direct publish' : 'Require Admin sign-off'}
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

interface ApproveDialogProps {
  postId: number | null;
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (params: { scheduledAt?: string; forceDuplicate?: boolean }) => void;
}

function ApproveDialog({ postId, isAdmin, open, onOpenChange, onApprove }: ApproveDialogProps) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [forceDuplicate, setForceDuplicate] = useState(false);

  const handleSubmit = () => {
    onApprove({
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      forceDuplicate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Approve Post #{postId}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? 'Choose how to publish this post. Admins can publish immediately or schedule a future date.'
              : 'Approving will flag this post for Admin final sign-off before it is published.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isAdmin && (
            <>
              <div className="space-y-2">
                <Label htmlFor="approve-scheduled-at">Schedule publish date (optional)</Label>
                <Input
                  id="approve-scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  placeholder="Leave blank to publish immediately"
                />
                <p className="text-xs text-muted-foreground">
                  {scheduledAt
                    ? `Will be scheduled for ${new Date(scheduledAt).toLocaleString()} (published by the scheduler)`
                    : 'Will be published immediately on approval.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="force-duplicate"
                  checked={forceDuplicate}
                  onChange={(e) => setForceDuplicate(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="force-duplicate" className="text-sm cursor-pointer">
                  Force approve even if duplicate content is detected
                </Label>
              </div>
            </>
          )}
          {!isAdmin && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Your approval will mark this post as "Pending Admin Review". An Admin must do the final sign-off to publish.
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleSubmit}
          >
            <CheckCircle className="w-4 h-4 me-1" />
            {isAdmin ? (scheduledAt ? 'Approve & Schedule' : 'Approve & Publish') : 'Approve for Review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BlogPostCardProps {
  post: CmsBlogPost;
  categories: CmsBlogCategory[];
  onEdit: () => void;
  onPublishToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewHistory: () => void;
  onDelete: () => void;
}

function BlogPostCard({ post, categories, onEdit, onPublishToggle, onApprove, onReject, onViewHistory, onDelete }: BlogPostCardProps) {
  const category = categories.find(c => c.id === post.categoryId);

  return (
    <Card data-testid={`card-post-${post.id}`}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {post.featuredImage && (
            <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{post.title}</h3>
                  {post.aiGenerated && (
                    <Badge variant="outline" className="border-purple-400 text-purple-700 bg-purple-50">
                      <Sparkles className="w-3 h-3 me-1" />
                      AI
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt ?? 'No excerpt provided'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={post.status === 'published' ? 'default' : post.status === 'rejected' ? 'destructive' : 'secondary'} data-testid={`badge-status-${post.id}`}>
                  {post.status}
                </Badge>
                <Badge variant="outline" data-testid={`badge-locale-${post.id}`}>
                  <Globe className="w-3 h-3 me-1" />
                  {post.locale?.toUpperCase() ?? 'EN'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {category && (
                <span className="flex items-center gap-1">
                  <Folder className="w-4 h-4" />
                  {category.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount ?? 0} views
              </span>
              {post.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              )}
              {post.scheduledPublishAt && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-4 h-4" />
                  Scheduled: {new Date(post.scheduledPublishAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onEdit} data-testid={`button-edit-${post.id}`}>
                <Edit className="w-4 h-4 me-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onPublishToggle} data-testid={`button-publish-${post.id}`}>
                <FileText className="w-4 h-4 me-1" />
                {post.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>

              {(post.status === 'draft' || post.status === 'rejected' || post.status === 'pending_admin_review') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-300 hover:bg-green-50"
                    onClick={onApprove}
                    data-testid={`button-approve-${post.id}`}
                  >
                    <CheckCircle className="w-4 h-4 me-1" />
                    {post.status === 'pending_admin_review' ? 'Final Approve' : 'Approve'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-50"
                    onClick={onReject}
                    data-testid={`button-reject-${post.id}`}
                  >
                    <XCircle className="w-4 h-4 me-1" />
                    Reject
                  </Button>
                </>
              )}

              <Button variant="outline" size="sm" onClick={onViewHistory} data-testid={`button-versions-${post.id}`}>
                <History className="w-4 h-4 me-1" />
                History
              </Button>

              <Button variant="outline" size="sm" onClick={onDelete} data-testid={`button-delete-${post.id}`}>
                <Trash2 className="w-4 h-4 me-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: PromptTemplate[];
  onSuccess: () => void;
}

function AIGenerateDialog({ open, onOpenChange, templates, onSuccess }: AIGenerateDialogProps) {
  const { toast } = useToast();
  const [sourceType, setSourceType] = useState('manual');
  const [sourceId, setSourceId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('default');
  const [contentType, setContentType] = useState('blog');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: sources } = useQuery<AvailableSources>({
    queryKey: ['/api/admin/content/sources'],
    queryFn: (): Promise<AvailableSources> => apiRequest('/api/admin/content/sources', { method: 'GET' }),
    enabled: open,
  });

  const handleGenerate = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest('/api/admin/content/generate', {
        method: 'POST',
        body: {
          sourceType,
          sourceId: sourceId ? parseInt(sourceId) : undefined,
          templateId: (templateId && templateId !== 'default') ? parseInt(templateId) : undefined,
          overrides: {
            topic: topic || undefined,
            contentType,
            tone,
            length,
          },
        }
      });
      onSuccess();
    } catch {
      toast({ title: 'Error', description: 'Failed to queue content generation.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Content Generation
          </DialogTitle>
          <DialogDescription>
            Generate a blog post, landing page, or Q&A article using AI from a scraper insight or custom topic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blog">Blog Article</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="qa">Q&A / FAQ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source Type</Label>
            <Select value={sourceType} onValueChange={(v) => { setSourceType(v); setSourceId(''); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Custom Topic</SelectItem>
                <SelectItem value="market_trend">Market Trend</SelectItem>
                <SelectItem value="competitor_price">Competitor Insight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sourceType === 'manual' && (
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the topic to write about..."
              />
            </div>
          )}

          {sourceType === 'market_trend' && sources?.trends && sources.trends.length > 0 && (
            <div className="space-y-2">
              <Label>Market Trend</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue placeholder="Select a trend..." /></SelectTrigger>
                <SelectContent>
                  {sources.trends.map((trend) => (
                    <SelectItem key={trend.id} value={trend.id.toString()}>{trend.trendName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sourceType === 'competitor_price' && sources?.competitorPriceItems && sources.competitorPriceItems.length > 0 && (
            <div className="space-y-2">
              <Label>Competitor Course</Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger><SelectValue placeholder="Select a competitor course..." /></SelectTrigger>
                <SelectContent>
                  {sources.competitorPriceItems.map((item) => (
                    <SelectItem key={item.id} value={item.id.toString()}>{item.courseName} ({item.competitorName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Prompt Template (optional)</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger><SelectValue placeholder="Use default template..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default template</SelectItem>
                  {templates.map((tmpl) => (
                    <SelectItem key={tmpl.id} value={tmpl.id.toString()}>{tmpl.name} ({tmpl.contentType})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (400-600)</SelectItem>
                  <SelectItem value="medium">Medium (800-1200)</SelectItem>
                  <SelectItem value="long">Long (1500-2500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={isSubmitting}>
              {isSubmitting ? (
                <><RefreshCw className="w-4 h-4 me-2 animate-spin" />Queueing...</>
              ) : (
                <><Sparkles className="w-4 h-4 me-2" />Generate Content</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface BlogPostEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CmsBlogPost | null;
  categories: CmsBlogCategory[];
  tags: CmsBlogTag[];
  onSave: (data: Partial<CmsBlogPost>) => void;
}

function BlogPostEditorDialog({ open, onOpenChange, post, categories, tags: _tags, onSave }: BlogPostEditorDialogProps) {
  const [formData, setFormData] = useState<Partial<CmsBlogPost>>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    categoryId: undefined,
    status: 'draft',
    locale: 'en',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    scheduledPublishAt: null,
  });

  useEffect(() => {
    if (post && open) {
      setFormData(post);
    } else if (!open) {
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        categoryId: undefined,
        status: 'draft',
        locale: 'en',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        scheduledPublishAt: null,
      });
    }
  }, [post, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Blog Post' : 'Create Blog Post'}</DialogTitle>
          <DialogDescription>
            {post ? 'Update your blog post details' : 'Create a new blog post for your CMS'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-title">Title *</Label>
                <Input
                  id="post-title"
                  value={formData.title ?? ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData(prev => ({ ...prev, title, slug: generateSlug(title) }));
                  }}
                  placeholder="Enter post title..."
                  required
                  data-testid="input-post-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-slug">Slug *</Label>
                <Input
                  id="post-slug"
                  value={formData.slug ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                  required
                  data-testid="input-post-slug"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-excerpt">Excerpt</Label>
                <Textarea
                  id="post-excerpt"
                  value={formData.excerpt ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary of the post..."
                  rows={3}
                  data-testid="textarea-post-excerpt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-content">Content *</Label>
                <RichTextWidget
                  field={{
                    id: 'content',
                    richTextConfig: {
                      placeholder: 'Write your blog post content here...',
                      toolbar: {
                        heading: true,
                        bulletList: true,
                        orderedList: true,
                        blockquote: true,
                        code: true,
                        textAlign: true,
                        highlight: true,
                        link: true,
                      }
                    }
                  }}
                  value={formData.content ?? ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                  language="en"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-featured-image">Featured Image</Label>
                <FileUploadWidget
                  field={{
                    id: 'featuredImage',
                    fileConfig: {
                      multiple: false,
                      maxSize: 5 * 1024 * 1024,
                      accept: ['image/*'],
                      subfolder: 'blog-featured',
                      showPreview: true
                    }
                  }}
                  value={formData.featuredImage ? [formData.featuredImage] : []}
                  onChange={(files: string[]) => setFormData(prev => ({ ...prev, featuredImage: files[0] ?? '' }))}
                  language="en"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-status">Status</Label>
                  <Select
                    value={formData.status ?? 'draft'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger id="post-status" data-testid="select-post-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="post-locale">Language</Label>
                  <Select
                    value={formData.locale ?? 'en'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, locale: value }))}
                  >
                    <SelectTrigger id="post-locale" data-testid="select-post-locale">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fa">Persian</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-category">Category</Label>
                <Select
                  value={formData.categoryId?.toString() ?? ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                >
                  <SelectTrigger id="post-category" data-testid="select-post-category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled-publish-at">Schedule Publish At (Admin only)</Label>
                <Input
                  id="scheduled-publish-at"
                  type="datetime-local"
                  value={formData.scheduledPublishAt ? new Date(formData.scheduledPublishAt).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledPublishAt: e.target.value ? new Date(e.target.value) : null }))}
                  data-testid="input-scheduled-publish"
                />
                <p className="text-xs text-muted-foreground">Scheduled publish requires Admin approval. Setting this alone does not publish the post.</p>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-meta-title">Meta Title</Label>
                <Input
                  id="post-meta-title"
                  value={formData.metaTitle ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO-optimized title..."
                  data-testid="input-post-meta-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-meta-description">Meta Description</Label>
                <Textarea
                  id="post-meta-description"
                  value={formData.metaDescription ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief SEO description..."
                  rows={3}
                  data-testid="textarea-post-meta-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-meta-keywords">Meta Keywords</Label>
                <Input
                  id="post-meta-keywords"
                  value={formData.metaKeywords ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                  data-testid="input-post-meta-keywords"
                />
              </div>

              {formData.jsonLdBlock && (
                <div className="space-y-2">
                  <Label>JSON-LD Structured Data</Label>
                  <Textarea
                    value={formData.jsonLdBlock ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, jsonLdBlock: e.target.value }))}
                    rows={5}
                    className="font-mono text-xs"
                    placeholder='{"@context":"https://schema.org",...}'
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" data-testid="button-save-post">
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
