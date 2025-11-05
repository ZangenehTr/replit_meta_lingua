import { useState, useEffect } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Filter,
  Search,
  Globe,
  Tag,
  Folder,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import type { CmsBlogPost, InsertCmsBlogPost, CmsBlogCategory, CmsBlogTag } from '@shared/schema';
import { FileUploadWidget } from '@/components/forms/widgets/FileUploadWidget';
import { RichTextWidget } from '@/components/forms/widgets/RichTextWidget';

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

  // Fetch blog posts with filters
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

  // Fetch categories
  const { data: categories = [] } = useQuery<CmsBlogCategory[]>({
    queryKey: ['/api/cms/blog/categories'],
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<CmsBlogTag[]>({
    queryKey: ['/api/cms/blog/tags'],
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: Partial<InsertCmsBlogPost>) => {
      return apiRequest('/api/cms/blog/posts', {
        method: 'POST',
        body: postData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Blog Post Created',
        description: 'The blog post has been created successfully.',
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create blog post. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CmsBlogPost> }) => {
      const updateData: Partial<InsertCmsBlogPost> = {
        title: data.title,
        titleEn: data.titleEn,
        titleFa: data.titleFa,
        titleAr: data.titleAr,
        slug: data.slug,
        excerpt: data.excerpt,
        excerptEn: data.excerptEn,
        excerptFa: data.excerptFa,
        excerptAr: data.excerptAr,
        content: data.content,
        contentEn: data.contentEn,
        contentFa: data.contentFa,
        contentAr: data.contentAr,
        featuredImage: data.featuredImage,
        authorId: data.authorId,
        categoryId: data.categoryId,
        status: data.status,
        locale: data.locale,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        ogImage: data.ogImage,
        publishedAt: data.publishedAt,
      };

      Object.keys(updateData).forEach(key => 
        updateData[key as keyof InsertCmsBlogPost] === undefined && delete updateData[key as keyof InsertCmsBlogPost]
      );

      return apiRequest(`/api/cms/blog/posts/${id}`, {
        method: 'PUT',
        body: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: 'Blog Post Updated',
        description: 'The blog post has been updated successfully.',
      });
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update blog post. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/cms/blog/posts/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Blog Post Deleted',
        description: 'The blog post has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cms/blog/posts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete blog post. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Publish/unpublish post
  const handlePublishToggle = (post: CmsBlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    updatePostMutation.mutate({
      id: post.id,
      data: {
        ...post,
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date() : null
      }
    });
  };

  // Filter posts by search query
  const filteredPosts = blogPosts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(query) ||
      post.titleEn?.toLowerCase().includes(query) ||
      post.titleFa?.toLowerCase().includes(query) ||
      post.titleAr?.toLowerCase().includes(query) ||
      post.excerpt?.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage blog posts for your CMS
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-post"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>

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
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-posts"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
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
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          {isLoadingPosts ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading blog posts...</p>
              </CardContent>
            </Card>
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">No blog posts found. Create your first post to get started!</p>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map(post => (
              <Card key={post.id} data-testid={`card-post-${post.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {post.featuredImage && (
                      <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt || 'No excerpt provided'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={post.status === 'published' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${post.id}`}
                          >
                            {post.status}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-locale-${post.id}`}>
                            <Globe className="w-3 h-3 mr-1" />
                            {post.locale?.toUpperCase() || 'EN'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {post.categoryId && (
                          <span className="flex items-center gap-1">
                            <Folder className="w-4 h-4" />
                            {categories.find(c => c.id === post.categoryId)?.name || 'Uncategorized'}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {post.viewCount || 0} views
                        </span>
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPost(post)}
                          data-testid={`button-edit-${post.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublishToggle(post)}
                          data-testid={`button-publish-${post.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this post?')) {
                              deletePostMutation.mutate(post.id);
                            }
                          }}
                          data-testid={`button-delete-${post.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <BlogPostEditorDialog
          open={isCreateDialogOpen || !!editingPost}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingPost(null);
            }
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
      </div>
    </AppLayout>
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

function BlogPostEditorDialog({
  open,
  onOpenChange,
  post,
  categories,
  tags,
  onSave,
}: BlogPostEditorDialogProps) {
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
  });

  // Update formData when post prop changes (for editing)
  useEffect(() => {
    if (post && open) {
      setFormData(post);
    } else if (!open) {
      // Reset to defaults when dialog closes
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
      });
    }
  }, [post, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

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
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      title,
                      slug: generateSlug(title)
                    }));
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
                  value={formData.slug}
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
                  value={formData.excerpt || ''}
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
                  value={formData.content || ''}
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
                  onChange={(files) => setFormData(prev => ({ ...prev, featuredImage: files[0] || '' }))}
                  language="en"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post-status">Status</Label>
                  <Select
                    value={formData.status}
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
                    value={formData.locale}
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
                  value={formData.categoryId?.toString() || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                >
                  <SelectTrigger id="post-category" data-testid="select-post-category">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="post-meta-title">Meta Title</Label>
                <Input
                  id="post-meta-title"
                  value={formData.metaTitle || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO-optimized title..."
                  data-testid="input-post-meta-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-meta-description">Meta Description</Label>
                <Textarea
                  id="post-meta-description"
                  value={formData.metaDescription || ''}
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
                  value={formData.metaKeywords || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                  data-testid="input-post-meta-keywords"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="post-og-image">OG Image URL</Label>
                <Input
                  id="post-og-image"
                  value={formData.ogImage || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="https://example.com/og-image.jpg"
                  data-testid="input-post-og-image"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-post">
              {post ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
