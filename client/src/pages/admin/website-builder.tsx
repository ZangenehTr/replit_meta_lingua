import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Globe, 
  Layout, 
  Palette, 
  Eye, 
  Code,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Upload,
  Link,
  Image,
  Type,
  Calendar,
  Users,
  BookOpen,
  Star,
  CheckCircle,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Phone
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebsiteTemplate {
  id: number;
  name: string;
  category: 'landing' | 'course_showcase' | 'institute_profile' | 'campaign';
  preview: string;
  features: string[];
  isResponsive: boolean;
  isConverted: boolean;
}

interface WebsitePage {
  id: number;
  title: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'archived';
  visits: number;
  conversions: number;
  lastModified: string;
}

export default function WebsiteBuilderPage() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeSection, setActiveSection] = useState('hero');

  const websiteTemplates: WebsiteTemplate[] = [
    {
      id: 1,
      name: "Persian Language Institute Landing",
      category: "landing",
      preview: "/templates/persian-landing.jpg",
      features: ["Hero Section", "Course Grid", "Teacher Profiles", "Testimonials", "Contact Form"],
      isResponsive: true,
      isConverted: true
    },
    {
      id: 2,
      name: "Course Showcase",
      category: "course_showcase", 
      preview: "/templates/course-showcase.jpg",
      features: ["Course Catalog", "Pricing Tables", "Schedule Display", "Enrollment Form"],
      isResponsive: true,
      isConverted: true
    },
    {
      id: 3,
      name: "Institute Profile",
      category: "institute_profile",
      preview: "/templates/institute-profile.jpg", 
      features: ["About Us", "Faculty", "Facilities", "Success Stories", "Contact"],
      isResponsive: true,
      isConverted: false
    },
    {
      id: 4,
      name: "Campaign Landing",
      category: "campaign",
      preview: "/templates/campaign-landing.jpg",
      features: ["Limited Offer", "Countdown Timer", "Lead Capture", "Social Proof"],
      isResponsive: true,
      isConverted: true
    }
  ];

  const existingPages: WebsitePage[] = [
    {
      id: 1,
      title: "Spring 2024 Enrollment",
      slug: "spring-2024-enrollment",
      template: "Persian Language Institute Landing",
      status: "published",
      visits: 2340,
      conversions: 127,
      lastModified: "2 hours ago"
    },
    {
      id: 2,
      title: "Business Persian Course",
      slug: "business-persian-course",
      template: "Course Showcase",
      status: "published", 
      visits: 890,
      conversions: 45,
      lastModified: "1 day ago"
    },
    {
      id: 3,
      title: "Summer Intensive Program",
      slug: "summer-intensive",
      template: "Campaign Landing",
      status: "draft",
      visits: 0,
      conversions: 0,
      lastModified: "3 days ago"
    }
  ];

  const socialIntegrations = [
    {
      platform: "Instagram",
      icon: Instagram,
      connected: true,
      features: ["Feed Widget", "Story Highlights", "Auto Post Sharing"],
      metrics: { followers: "2.3K", engagement: "4.2%" }
    },
    {
      platform: "Telegram",
      icon: Phone,
      connected: true,
      features: ["Channel Widget", "Join Button", "Message Integration"],
      metrics: { subscribers: "5.2K", active: "78%" }
    },
    {
      platform: "YouTube",
      icon: Youtube,
      connected: true,
      features: ["Video Gallery", "Channel Subscribe", "Latest Videos"],
      metrics: { subscribers: "890", views: "12.4K" }
    },
    {
      platform: "LinkedIn",
      icon: Linkedin,
      connected: false,
      features: ["Company Page", "Professional Network", "Article Sharing"],
      metrics: { connections: "567", reach: "8.9K" }
    },
    {
      platform: "Twitter",
      icon: Twitter,
      connected: true,
      features: ["Tweet Feed", "Follow Button", "Hashtag Display"],
      metrics: { followers: "1.1K", engagement: "2.8%" }
    }
  ];

  const pageElements = [
    { type: 'hero', label: 'Hero Section', icon: Layout },
    { type: 'courses', label: 'Course Grid', icon: BookOpen },
    { type: 'teachers', label: 'Teacher Profiles', icon: Users },
    { type: 'testimonials', label: 'Testimonials', icon: Star },
    { type: 'pricing', label: 'Pricing Table', icon: CheckCircle },
    { type: 'contact', label: 'Contact Form', icon: Phone },
    { type: 'social', label: 'Social Media', icon: Instagram },
    { type: 'calendar', label: 'Event Calendar', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Website Builder & Campaign Pages
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create conversion-optimized websites with social media integration
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button>
            <Globe className="h-4 w-4 mr-2" />
            New Page
          </Button>
        </div>
      </div>

      {/* Website Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Pages
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visits
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,234</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4%</div>
            <p className="text-xs text-muted-foreground">
              Above industry average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Social Reach
            </CardTitle>
            <Instagram className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9.8K</div>
            <p className="text-xs text-muted-foreground">
              Cross-platform followers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">My Pages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Page Builder</TabsTrigger>
          <TabsTrigger value="social">Social Integration</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <Card>
            <CardHeader>
              <CardTitle>Published Pages</CardTitle>
              <CardDescription>
                Manage your website pages and campaign landing pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingPages.map((page) => (
                  <Card key={page.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium">{page.title}</h3>
                            <Badge className={`text-xs ${
                              page.status === 'published' ? 'bg-green-100 text-green-800' :
                              page.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {page.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-500 mb-2">
                            metalingua.com/{page.slug}
                          </p>
                          
                          <p className="text-xs text-gray-400 mb-3">
                            Template: {page.template} • Last modified: {page.lastModified}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Visits</p>
                              <p className="text-lg font-bold">{page.visits.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Conversions</p>
                              <p className="text-lg font-bold text-green-600">{page.conversions}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Conversion Rate</p>
                              <p className="text-lg font-bold">
                                {page.visits > 0 ? ((page.conversions / page.visits) * 100).toFixed(1) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Layout className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Professional Website Templates</CardTitle>
              <CardDescription>
                Choose from conversion-optimized templates for Persian language institutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {websiteTemplates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        <Globe className="h-12 w-12 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-500">Preview</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {template.category.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {template.isResponsive && (
                            <Badge className="text-xs bg-blue-100 text-blue-800">Responsive</Badge>
                          )}
                          {template.isConverted && (
                            <Badge className="text-xs bg-green-100 text-green-800">High Converting</Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500">Features:</p>
                          {template.features.slice(0, 3).map((feature, idx) => (
                            <p key={idx} className="text-xs text-gray-600">• {feature}</p>
                          ))}
                          {template.features.length > 3 && (
                            <p className="text-xs text-gray-400">+{template.features.length - 3} more</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm" className="flex-1">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Page Elements Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page Elements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pageElements.map((element) => {
                    const IconComponent = element.icon;
                    return (
                      <div
                        key={element.type}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          activeSection === element.type ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveSection(element.type)}
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-4 w-4" />
                          <span className="text-sm">{element.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Page Builder Canvas */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Page Builder</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'tablet' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('tablet')}
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`border rounded-lg bg-white min-h-96 ${
                  previewMode === 'desktop' ? 'w-full' :
                  previewMode === 'tablet' ? 'w-3/4 mx-auto' :
                  'w-1/2 mx-auto'
                }`}>
                  <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold mb-4">Meta Lingua Persian Institute</h2>
                    <p className="text-gray-600 mb-6">Learn Persian with Native Iranian Teachers</p>
                    <Button className="mb-6">Start Your Journey</Button>
                    
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">500+</div>
                        <div className="text-sm text-gray-500">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">15+</div>
                        <div className="text-sm text-gray-500">Teachers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">98%</div>
                        <div className="text-sm text-gray-500">Success Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Section Title</Label>
                    <Input defaultValue="Meta Lingua Persian Institute" />
                  </div>
                  <div>
                    <Label className="text-sm">Subtitle</Label>
                    <Input defaultValue="Learn Persian with Native Iranian Teachers" />
                  </div>
                  <div>
                    <Label className="text-sm">Button Text</Label>
                    <Input defaultValue="Start Your Journey" />
                  </div>
                  <div>
                    <Label className="text-sm">Background Color</Label>
                    <div className="flex space-x-2">
                      <Input type="color" value="#ffffff" className="w-12 h-8" />
                      <Input value="#ffffff" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Text Color</Label>
                    <div className="flex space-x-2">
                      <Input type="color" value="#000000" className="w-12 h-8" />
                      <Input value="#000000" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Integration</CardTitle>
              <CardDescription>
                Connect and embed social media content into your websites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {socialIntegrations.map((integration, index) => {
                  const IconComponent = integration.icon;
                  return (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-4">
                            <IconComponent className="h-8 w-8 text-blue-600" />
                            <div>
                              <h3 className="font-medium">{integration.platform}</h3>
                              <div className="flex space-x-4 text-sm text-gray-500">
                                <span>{integration.metrics.followers || integration.metrics.subscribers} followers</span>
                                <span>{integration.metrics.engagement || integration.metrics.active} engagement</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={integration.connected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {integration.connected ? 'Connected' : 'Setup Required'}
                            </Badge>
                            <Switch checked={integration.connected} />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">Available Widgets:</p>
                          <div className="flex flex-wrap gap-2">
                            {integration.features.map((feature, featureIndex) => (
                              <Badge key={featureIndex} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Code className="h-4 w-4 mr-2" />
                            Embed Code
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          {!integration.connected && (
                            <Button size="sm">
                              <Link className="h-4 w-4 mr-2" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                <Card>
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium mb-2">Auto-Sync Social Content</h3>
                    <p className="text-gray-500 mb-4">
                      Automatically display latest posts, videos, and updates from all connected platforms
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Switch />
                      <Label>Enable auto-sync across all websites</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Website Performance Analytics</CardTitle>
              <CardDescription>
                Track visitor behavior and conversion metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Performing Pages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Spring 2024 Enrollment</span>
                        <span className="font-medium">5.4% CVR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Business Persian Course</span>
                        <span className="font-medium">5.1% CVR</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Summer Intensive</span>
                        <span className="font-medium">4.8% CVR</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Instagram</span>
                        <span className="font-medium">35%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Google Search</span>
                        <span className="font-medium">28%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Direct</span>
                        <span className="font-medium">22%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Telegram</span>
                        <span className="font-medium">15%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}