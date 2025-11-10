import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, ArrowLeft, Share2, Tag, User, Clock } from 'lucide-react';
import type { CmsBlogPost } from '@shared/schema';

export default function BlogDetail() {
  const [match, params] = useRoute('/blog/:slug');
  const { t } = useTranslation(['common']);
  const slug = params?.slug;

  const { data: post, isLoading } = useQuery<CmsBlogPost>({
    queryKey: ['/api/cms/blog/posts/slug', slug],
    queryFn: async () => {
      const response = await fetch(`/api/cms/blog/posts/slug/${slug}`);
      if (!response.ok) throw new Error('Post not found');
      return response.json();
    },
    enabled: !!slug
  });

  const { data: relatedPosts = [] } = useQuery<CmsBlogPost[]>({
    queryKey: ['/api/cms/blog/posts', 'related', post?.categoryId],
    queryFn: async () => {
      if (!post?.categoryId) return [];
      const response = await fetch(`/api/cms/blog/posts?categoryId=${post.categoryId}&status=published`);
      const posts = await response.json();
      return posts.filter((p: CmsBlogPost) => p.id !== post?.id).slice(0, 3);
    },
    enabled: !!post?.categoryId
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Button asChild><Link href="/blog">Back to Blog</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <SEOHead
        title={post?.title || 'Blog Post'}
        description={post?.metaDescription || post?.excerpt || 'Read this article on Meta Lingua Academy'}
        keywords={post?.metaKeywords || post?.tags?.join(', ') || 'language learning'}
        ogImage={post?.featuredImage || undefined}
        ogType="article"
      />
      <article className="mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-blog">
          <Link href="/blog" className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Back to Blog</Link>
        </Button>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">{post.locale}</Badge>
            {post.tags && post.tags.map((tag, i) => <Badge key={i} variant="outline"><Tag className="h-3 w-3 mr-1" />{tag}</Badge>)}
          </div>
          
          <h1 className="text-4xl font-bold mb-4" data-testid="text-post-title">{post.title}</h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {post.authorName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.authorName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
            </div>
            {post.readingTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min read</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigator.share?.({ title: post.title, url: window.location.href })} data-testid="button-share">
              <Share2 className="h-4 w-4 mr-2" />Share
            </Button>
          </div>
        </header>

        {post.featuredImage && (
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg max-w-none dark:prose-invert mb-12" dangerouslySetInnerHTML={{ __html: post.content || '' }} data-testid="content-post-body" />

        <Separator className="my-12" />

        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(related => (
                <Card key={related.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`related-post-${related.id}`}>
                  {related.featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <img src={related.featuredImage} alt={related.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2">
                      <Link href={`/blog/${related.slug}`}><a className="hover:text-primary transition-colors">{related.title}</a></Link>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{related.excerpt}</p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </article>
    </PublicLayout>
  );
}
