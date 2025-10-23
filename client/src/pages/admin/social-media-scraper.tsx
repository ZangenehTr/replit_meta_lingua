import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Youtube, 
  MessageCircle, 
  Mail,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Eye,
  TrendingUp,
  Users,
  FileText,
  Phone,
  Image
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

const PLATFORM_ICONS: Record<string, any> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  telegram: MessageCircle,
  email: Mail,
  whatsapp: Phone,
  whatsapp_business: Phone,
  pinterest: Image
};

export default function SocialMediaScraperAdmin() {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [newJobOpen, setNewJobOpen] = useState(false);

  // Fetch scraped content
  const { data: scrapedContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ['/api/admin/social-media/content', { platform: selectedPlatform }],
  });

  // Fetch scrape jobs
  const { data: scrapeJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/scraper/jobs'],
  });

  // Fetch analytics
  const { data: analytics = {}, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/social-media/analytics'],
  });

  // Create scrape job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return apiRequest('/api/admin/scraper/create-job', 'POST', jobData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraper/jobs'] });
      toast({
        title: 'Scrape Job Created',
        description: 'The scraping job has been queued successfully.',
      });
      setNewJobOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create scrape job',
        variant: 'destructive',
      });
    },
  });

  // Retry job mutation
  const retryJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return apiRequest(`/api/admin/scraper/retry/${jobId}`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/scraper/jobs'] });
      toast({
        title: 'Job Restarted',
        description: 'The scraping job has been restarted.',
      });
    },
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      pending: 'secondary',
      running: 'default',
      completed: 'success',
      failed: 'destructive',
    };
    return colors[status] || 'outline';
  };

  const getPlatformIcon = (platform: string) => {
    const Icon = PLATFORM_ICONS[platform.toLowerCase()] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Social Media Scraper Management</h1>
        <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-scrape-job">
              <Plus className="h-4 w-4 mr-2" />
              New Scrape Job
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scrape Job</DialogTitle>
              <DialogDescription>
                Configure a new scraping job for social media content.
              </DialogDescription>
            </DialogHeader>
            <NewJobForm
              onSubmit={(data) => createJobMutation.mutate(data)}
              isLoading={createJobMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts Scraped</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scrapeJobs.filter((j: any) => j.status === 'running').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently scraping
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgEngagement || '0'}%</div>
            <p className="text-xs text-muted-foreground">
              Average across platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.leadsGenerated || 0}</div>
            <p className="text-xs text-muted-foreground">
              From scraped content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-4">
        <Label htmlFor="platform-filter">Filter by Platform:</Label>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger id="platform-filter" className="w-[200px]" data-testid="select-platform-filter">
            <SelectValue placeholder="All Platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp_business">WhatsApp Business</SelectItem>
            <SelectItem value="pinterest">Pinterest</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scrape Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scrape Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="text-center py-8">Loading jobs...</div>
          ) : scrapeJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scrape jobs found. Create a new job to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target URL</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapeJobs.map((job: any) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(job.platform || 'unknown')}
                        <span className="capitalize">{job.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.jobType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(job.status)}>{job.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {job.targetUrl}
                    </TableCell>
                    <TableCell>
                      {job.itemsProcessed || 0} / {job.totalItems || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`button-view-job-${job.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {job.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => retryJobMutation.mutate(job.id)}
                            disabled={retryJobMutation.isPending}
                            data-testid={`button-retry-job-${job.id}`}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Scraped Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scraped Content</CardTitle>
        </CardHeader>
        <CardContent>
          {contentLoading ? (
            <div className="text-center py-8">Loading content...</div>
          ) : scrapedContent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No content scraped yet. Create a scrape job to start collecting data.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Scraped At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapedContent.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(item.platform)}
                        <span className="capitalize">{item.platform}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate">{item.content || item.text}</div>
                    </TableCell>
                    <TableCell>{item.author}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>👍 {item.likes || 0}</div>
                        <div>💬 {item.comments || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(item.scrapedAt || item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        data-testid={`button-view-content-${item.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// New Job Form Component
function NewJobForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    platform: 'instagram',
    jobType: 'lead_generation',
    targetUrl: '',
    maxItems: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={formData.platform}
          onValueChange={(value) => setFormData({ ...formData, platform: value })}
        >
          <SelectTrigger id="platform" data-testid="select-job-platform">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp_business">WhatsApp Business</SelectItem>
            <SelectItem value="pinterest">Pinterest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="jobType">Job Type</Label>
        <Select
          value={formData.jobType}
          onValueChange={(value) => setFormData({ ...formData, jobType: value })}
        >
          <SelectTrigger id="jobType" data-testid="select-job-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead_generation">Lead Generation</SelectItem>
            <SelectItem value="competitor_pricing">Competitor Pricing</SelectItem>
            <SelectItem value="market_trends">Market Trends</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="targetUrl">Target URL</Label>
        <Input
          id="targetUrl"
          type="url"
          placeholder="https://instagram.com/..."
          value={formData.targetUrl}
          onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
          required
          data-testid="input-target-url"
        />
      </div>

      <div>
        <Label htmlFor="maxItems">Max Items to Scrape</Label>
        <Input
          id="maxItems"
          type="number"
          min="1"
          max="1000"
          value={formData.maxItems}
          onChange={(e) => setFormData({ ...formData, maxItems: parseInt(e.target.value) })}
          required
          data-testid="input-max-items"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full" data-testid="button-submit-job">
        {isLoading ? 'Creating...' : 'Create Scrape Job'}
      </Button>
    </form>
  );
}
