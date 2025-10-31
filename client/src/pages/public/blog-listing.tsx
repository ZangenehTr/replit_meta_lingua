import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, Folder, ChevronLeft, ChevronRight, BookOpen, TrendingUp } from 'lucide-react';
import type { CmsBlogPost, CmsBlogCategory } from '@shared/schema';

const POSTS_PER_PAGE = 9;

export default function BlogListing() {
  const { t, i18n } = useTranslation(['common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocale, setSelectedLocale] = useState<string>(i18n.language || 'en');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: blogPosts = [], isLoading: isLoadingPosts } = useQuery<CmsBlogPost[]>({
    queryKey: ['/api/cms/blog/posts', 'published', selectedCategory, selectedLocale],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'published');
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);
      if (selectedLocale !== 'all') params.append('locale', selectedLocale);
      const response = await fetch(`/api/cms/blog/posts?${params.toString()}`);
      return response.json();
    }
  });

  const { data: categories = [] } = useQuery<CmsBlogCategory[]>({
    queryKey: ['/api/cms/blog/categories'],
    queryFn: async () => {
      const response = await fetch('/api/cms/blog/categories');
      return response.json();
    }
  });

  const filteredPosts = blogPosts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.title?.toLowerCase().includes(query) || post.excerpt?.toLowerCase().includes(query);
  });

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name || 'Category';
  };

  return (
    <PublicLayout>
      <SEOHead
        title={t('blog.seoTitle', 'Blog - Latest Articles')}
        description={t('blog.seoDescription', 'Explore our latest articles, tips, and insights about language learning from Meta Lingua Academy.')}
        keywords="language learning blog, learning tips, language articles"
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Blog</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Latest Articles & Insights</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tips, stories, and insights from our language learning community
            </p>
          </div>
        </div>
      </section>

      <section className="border-b bg-background/50 backdrop-blur sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                  data-testid="input-search-blog"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <Folder className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedLocale} onValueChange={(value) => { setSelectedLocale(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fa">فارسی</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Showing {filteredPosts.length} articles</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoadingPosts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i}><Skeleton className="aspect-video w-full" /><CardHeader><Skeleton className="h-6 w-full" /></CardHeader></Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No articles found</h3>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedPosts.map(post => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow group" data-testid={`blog-post-${post.id}`}>
                    {post.featuredImage && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex gap-2 mb-3">
                        <Badge variant="secondary">{post.locale}</Badge>
                        {post.categoryId && <Badge>{getCategoryName(post.categoryId)}</Badge>}
                      </div>
                      <CardTitle className="line-clamp-2">
                        <Link href={`/blog/${post.slug}`}><a className="hover:text-primary transition-colors">{post.title}</a></Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{post.excerpt || post.metaDescription}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} data-testid="button-prev-page">
                    <ChevronLeft className="h-4 w-4 mr-1" />Previous
                  </Button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" className="w-10" onClick={() => setCurrentPage(page)} data-testid={`button-page-${page}`}>
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} data-testid="button-next-page">
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
