import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Globe,
  Zap,
  Users,
  BookOpen,
  Video,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  Play,
  Calendar,
} from 'lucide-react';
import type { CmsBlogPost, CmsVideo } from '@shared/schema';

export default function PublicHome() {
  const { t } = useTranslation(['common']);

  // Fetch latest 3 published blog posts
  const { data: blogPosts = [] } = useQuery<CmsBlogPost[]>({
    queryKey: ['/api/cms/blog/posts', 'published'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('status', 'published');
      
      const response = await fetch(`/api/cms/blog/posts?${params.toString()}`);
      const data = await response.json();
      return data.slice(0, 3); // Latest 3 posts
    }
  });

  // Fetch latest 3 active videos
  const { data: videos = [] } = useQuery<CmsVideo[]>({
    queryKey: ['/api/cms/videos', 'active'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      
      const response = await fetch(`/api/cms/videos?${params.toString()}`);
      const data = await response.json();
      return data.slice(0, 3); // Latest 3 videos
    }
  });

  const features = [
    {
      icon: Globe,
      title: t('features.multilingual.title', 'Multilingual Platform'),
      description: t('features.multilingual.desc', 'Learn in English, Persian, or Arabic with full RTL support'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Zap,
      title: t('features.ai.title', 'AI-Powered Learning'),
      description: t('features.ai.desc', 'Personalized lessons adapted to your learning style and pace'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: t('features.community.title', 'Global Community'),
      description: t('features.community.desc', 'Connect with learners and native speakers worldwide'),
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Award,
      title: t('features.certified.title', 'Certified Courses'),
      description: t('features.certified.desc', 'Earn recognized certificates upon course completion'),
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const stats = [
    { label: t('stats.students', 'Active Students'), value: '10,000+', icon: Users },
    { label: t('stats.courses', 'Courses'), value: '50+', icon: BookOpen },
    { label: t('stats.satisfaction', 'Satisfaction'), value: '98%', icon: Star },
    { label: t('stats.languages', 'Languages'), value: '15+', icon: Globe },
  ];

  return (
    <PublicLayout>
      <SEOHead
        title={t('home.seoTitle', 'Meta Lingua - AI-Powered Language Learning')}
        description={t('home.seoDescription', 'Learn languages with AI-powered tutoring, interactive courses, and a supportive global community. Start your language learning journey today!')}
        keywords="language learning, AI tutoring, online courses, language academy"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6" data-testid="badge-new-feature">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                {t('hero.badge', 'New: AI Study Partner Now Available')}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              <span className="block">{t('hero.title1', 'Learn Languages')}</span>
              <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('hero.title2', 'The Smart Way')}
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
              {t('hero.description', 'Master any language with AI-powered lessons, interactive exercises, and personalized feedback. Join thousands of learners worldwide.')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-lg px-8"
                data-testid="button-start-learning"
              >
                <Link href="/auth?tab=register">
                  <a className="flex items-center gap-2">
                    {t('cta.startLearning', 'Start Learning Free')}
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="text-lg px-8"
                data-testid="button-browse-courses"
              >
                <Link href="/linguaquest">
                  <a className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {t('cta.browseCourses', 'Browse Free Courses')}
                  </a>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-background/50 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center" data-testid={`stat-${index}`}>
                  <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              {t('features.heading', 'Why Choose Meta Lingua?')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subheading', 'Experience the next generation of language learning with cutting-edge technology and proven methodologies.')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors" data-testid={`feature-${index}`}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      {blogPosts.length > 0 && (
        <section className="py-24 bg-accent/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {t('blog.heading', 'Latest Articles')}
                </h2>
                <p className="text-muted-foreground">
                  {t('blog.subheading', 'Tips, insights, and stories from our community')}
                </p>
              </div>
              <Button asChild variant="outline" data-testid="button-view-all-blog">
                <Link href="/blog">
                  <a className="flex items-center gap-2">
                    {t('cta.viewAll', 'View All')}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`blog-post-${post.id}`}>
                  {post.featuredImage && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">{post.locale}</Badge>
                      {post.categoryId && <Badge>{t('category')}</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/blog/${post.slug}`}>
                        <a className="hover:text-primary transition-colors">
                          {post.title}
                        </a>
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt || post.metaDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Videos */}
      {videos.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {t('videos.heading', 'Featured Videos')}
                </h2>
                <p className="text-muted-foreground">
                  {t('videos.subheading', 'Learn from our expert instructors')}
                </p>
              </div>
              <Button asChild variant="outline" data-testid="button-view-all-videos">
                <Link href="/videos">
                  <a className="flex items-center gap-2">
                    {t('cta.viewAll', 'View All')}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`video-${video.id}`}>
                  <div className="aspect-video overflow-hidden relative group">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex gap-2 mb-2">
                      <Badge variant="secondary">{video.locale}</Badge>
                      {video.category && <Badge>{video.category}</Badge>}
                    </div>
                    <CardTitle className="line-clamp-2">
                      <Link href={`/videos/${video.id}`}>
                        <a className="hover:text-primary transition-colors">
                          {video.title}
                        </a>
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {video.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {video.duration ? `${Math.floor(video.duration / 60)}min` : 'N/A'}
                      </div>
                      {video.viewCount && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {video.viewCount} {t('views')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-purple-600 text-white">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-medium">{t('limitedTimeOffer')}</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">
            {t('cta.final.title', 'Ready to Transform Your Language Skills?')}
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            {t('cta.final.description', 'Join thousands of successful learners. Start your free trial today and experience the future of language learning.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8"
              data-testid="button-cta-start-free"
            >
              <Link href="/auth?tab=register">
                <a className="flex items-center gap-2">
                  {t('cta.startFree', 'Start Free Trial')}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Link>
            </Button>
            
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
              data-testid="button-cta-learn-more"
            >
              <Link href="/about">
                <a>{t('cta.learnMore', 'Learn More')}</a>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
