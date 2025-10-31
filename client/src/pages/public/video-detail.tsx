import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from '@/components/layout/public-layout';
import { SEOHead } from '@/components/seo-head';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Play, Eye, Calendar, Share2 } from 'lucide-react';
import type { CmsVideo } from '@shared/schema';

export default function VideoDetail() {
  const [match, params] = useRoute('/videos/:id');
  const { t } = useTranslation(['common']);
  const videoId = params?.id ? parseInt(params.id) : null;

  const { data: video, isLoading } = useQuery<CmsVideo>({
    queryKey: ['/api/cms/videos', videoId],
    queryFn: async () => {
      const response = await fetch(`/api/cms/videos/${videoId}`);
      if (!response.ok) throw new Error('Video not found');
      return response.json();
    },
    enabled: !!videoId
  });

  const { data: relatedVideos = [] } = useQuery<CmsVideo[]>({
    queryKey: ['/api/cms/videos', 'related', video?.category],
    queryFn: async () => {
      if (!video?.category) return [];
      const response = await fetch(`/api/cms/videos?category=${video.category}&isActive=true`);
      const videos = await response.json();
      return videos.filter((v: CmsVideo) => v.id !== video?.id).slice(0, 3);
    },
    enabled: !!video?.category
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="aspect-video bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!video) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <Button asChild><Link href="/videos"><a>Back to Videos</a></Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const getVideoEmbedUrl = () => {
    if (video.videoType === 'youtube' && video.youtubeUrl) {
      const videoId = video.youtubeUrl.split('v=')[1] || video.youtubeUrl.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (video.videoType === 'vimeo' && video.vimeoUrl) {
      const videoId = video.vimeoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return video.localVideoPath;
  };

  return (
    <PublicLayout>
      <SEOHead
        title={video?.title || 'Video'}
        description={video?.description || 'Watch this video on Meta Lingua Academy'}
        keywords={video?.category || 'language learning video'}
        ogImage={video?.thumbnail || undefined}
        ogType="video.other"
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-videos">
          <Link href="/videos"><a className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Back to Videos</a></Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-lg mb-6 bg-black">
              {video.videoType === 'local' ? (
                <video controls className="w-full h-full" data-testid="video-player">
                  <source src={video.localVideoPath || ''} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={getVideoEmbedUrl()}
                  className="w-full h-full"
                  allowFullScreen
                  data-testid="video-iframe"
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{video.locale}</Badge>
              {video.category && <Badge>{video.category}</Badge>}
            </div>

            <h1 className="text-3xl font-bold mb-4" data-testid="text-video-title">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              {video.viewCount !== null && (
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{video.viewCount} views</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
              {video.duration && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>{Math.floor(video.duration / 60)} minutes</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigator.share?.({ title: video.title, url: window.location.href })} data-testid="button-share">
                <Share2 className="h-4 w-4 mr-2" />Share
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="prose max-w-none dark:prose-invert" data-testid="content-video-description">
              <h2>About this video</h2>
              <p>{video.description}</p>
              {video.transcript && (
                <>
                  <h3>Transcript</h3>
                  <div dangerouslySetInnerHTML={{ __html: video.transcript }} />
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {relatedVideos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
                <div className="space-y-4">
                  {relatedVideos.map(related => (
                    <Card key={related.id} className="overflow-hidden hover:shadow-md transition-shadow" data-testid={`related-video-${related.id}`}>
                      <Link href={`/videos/${related.id}`}>
                        <a className="flex gap-3 p-3">
                          <div className="w-32 aspect-video overflow-hidden rounded flex-shrink-0">
                            {related.thumbnail ? (
                              <img src={related.thumbnail} alt={related.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Play className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 text-sm mb-1">{related.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{related.description}</p>
                          </div>
                        </a>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
