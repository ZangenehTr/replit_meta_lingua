import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Video, Play, TrendingUp } from 'lucide-react';
import type { CmsVideo } from '@shared/schema';

export default function VideoGallery() {
  const { t } = useTranslation(['common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocale, setSelectedLocale] = useState<string>('all');

  const { data: videos = [], isLoading } = useQuery<CmsVideo[]>({
    queryKey: ['/api/cms/videos', 'active', selectedCategory, selectedLocale],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLocale !== 'all') params.append('locale', selectedLocale);
      const response = await fetch(`/api/cms/videos?${params.toString()}`);
      return response.json();
    }
  });

  const filteredVideos = videos.filter(video => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return video.title?.toLowerCase().includes(query) || video.description?.toLowerCase().includes(query);
  });

  return (
    <PublicLayout>
      <SEOHead
        title={t('videos.seoTitle', 'Video Library')}
        description={t('videos.seoDescription', 'Watch our video tutorials and courses to improve your language skills with Meta Lingua Academy.')}
        keywords="language learning videos, tutorial videos, language courses"
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Video className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Videos</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Video Library</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn from expert instructors with our video tutorials and courses
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
                <Input placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" data-testid="input-search-videos" />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="lesson">Lesson</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocale} onValueChange={setSelectedLocale}>
              <SelectTrigger className="w-full md:w-40" data-testid="select-language">
                <SelectValue placeholder="All Languages" />
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
            <span>Showing {filteredVideos.length} videos</span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map(video => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow group" data-testid={`video-${video.id}`}>
                <div className="aspect-video overflow-hidden relative">
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
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
                    <Link href={`/videos/${video.id}`}><a className="hover:text-primary transition-colors">{video.title}</a></Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{video.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {video.duration ? `${Math.floor(video.duration / 60)}min` : 'N/A'}
                    </div>
                    {video.viewCount && <span>{video.viewCount} views</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
