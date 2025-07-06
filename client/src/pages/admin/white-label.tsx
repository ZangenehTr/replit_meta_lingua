import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Building2, 
  Globe, 
  Palette, 
  Settings, 
  Upload,
  Copy,
  Eye,
  Download,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Institute {
  id: number;
  name: string;
  subdomain: string;
  domain?: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  status: 'active' | 'pending' | 'suspended';
  features: string[];
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
  createdAt: string;
  studentsCount: number;
  teachersCount: number;
  monthlyRevenue: number;
}

export default function WhiteLabelPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch institutes data
  const { data: institutes = [], isLoading } = useQuery({
    queryKey: ['/api/admin/white-label/institutes'],
  });

  // Create institute mutation
  const createInstituteMutation = useMutation({
    mutationFn: (instituteData: Partial<Institute>) => 
      apiRequest('/api/admin/white-label/institutes', 'POST', instituteData),
    onSuccess: () => {
      toast({
        title: "Institute Created",
        description: "New white-label institute has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/white-label/institutes'] });
      setIsCreateModalOpen(false);
    },
  });

  // Update institute mutation
  const updateInstituteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Institute> }) => 
      apiRequest(`/api/admin/white-label/institutes/${id}`, 'PUT', data),
    onSuccess: () => {
      toast({
        title: "Institute Updated",
        description: "Institute settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/white-label/institutes'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            White-Label Institute Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage multiple language institutes with custom branding
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Create New Institute
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Institutes
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,300,000 IRR</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,847</div>
            <p className="text-xs text-muted-foreground">
              Across all institutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              Institute satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="institutes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="institutes">Institute Overview</TabsTrigger>
          <TabsTrigger value="branding">Branding Settings</TabsTrigger>
          <TabsTrigger value="features">Feature Management</TabsTrigger>
          <TabsTrigger value="deployment">Deployment Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="institutes">
          <Card>
            <CardHeader>
              <CardTitle>Institute Management</CardTitle>
              <CardDescription>
                Manage all white-label institute deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: "Tehran Persian Academy",
                    subdomain: "tehran-academy",
                    domain: "tehranpersian.com",
                    status: 'active',
                    subscriptionPlan: 'professional',
                    studentsCount: 234,
                    teachersCount: 12,
                    monthlyRevenue: 12500000
                  },
                  {
                    id: 2,
                    name: "Isfahan Language Center",
                    subdomain: "isfahan-center",
                    domain: undefined,
                    status: 'active',
                    subscriptionPlan: 'basic',
                    studentsCount: 89,
                    teachersCount: 6,
                    monthlyRevenue: 4200000
                  },
                  {
                    id: 3,
                    name: "Shiraz Cultural Institute",
                    subdomain: "shiraz-cultural",
                    domain: "shirazi-institute.ir",
                    status: 'pending',
                    subscriptionPlan: 'enterprise',
                    studentsCount: 0,
                    teachersCount: 0,
                    monthlyRevenue: 0
                  }
                ].map((institute) => (
                  <div key={institute.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{institute.name}</p>
                        <p className="text-sm text-gray-500">
                          {institute.domain || `${institute.subdomain}.metalingua.com`}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {institute.studentsCount} students
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {institute.teachersCount} teachers
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(institute.status)}>
                          {institute.status.charAt(0).toUpperCase() + institute.status.slice(1)}
                        </Badge>
                        <Badge className={getPlanColor(institute.subscriptionPlan)}>
                          {institute.subscriptionPlan.charAt(0).toUpperCase() + institute.subscriptionPlan.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">
                        {institute.monthlyRevenue.toLocaleString()} IRR/month
                      </p>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Custom Branding Configuration</CardTitle>
              <CardDescription>
                Customize appearance for each institute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>Institute Logo</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-600" />
                    </div>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Color Scheme</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="color" value="#3B82F6" className="w-12 h-8" />
                        <Input value="#3B82F6" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="color" value="#6366F1" className="w-12 h-8" />
                        <Input value="#6366F1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Custom Domain Settings</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Subdomain</Label>
                    <Input placeholder="institute-name" />
                    <p className="text-xs text-gray-500 mt-1">
                      Will create: institute-name.metalingua.com
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">Custom Domain (Optional)</Label>
                    <Input placeholder="www.institute.com" />
                    <p className="text-xs text-gray-500 mt-1">
                      Requires DNS configuration
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Management</CardTitle>
              <CardDescription>
                Control which features are available for each subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      plan: 'Basic',
                      price: '2,500,000 IRR/month',
                      features: [
                        'Up to 50 students',
                        'Basic course management',
                        'Email support',
                        'Standard branding'
                      ]
                    },
                    {
                      plan: 'Professional', 
                      price: '7,500,000 IRR/month',
                      features: [
                        'Up to 200 students',
                        'Advanced analytics',
                        'SMS notifications',
                        'Custom domain',
                        'Priority support'
                      ]
                    },
                    {
                      plan: 'Enterprise',
                      price: '15,000,000 IRR/month',
                      features: [
                        'Unlimited students',
                        'White-label API access',
                        'Multi-location support',
                        'Custom integrations',
                        'Dedicated support'
                      ]
                    }
                  ].map((plan, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg">{plan.plan}</CardTitle>
                        <CardDescription className="text-xl font-bold text-primary">
                          {plan.price}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Tools</CardTitle>
              <CardDescription>
                One-click deployment and management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Deploy</CardTitle>
                      <CardDescription>
                        Deploy a new institute in minutes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        One-Click Deploy
                      </Button>
                      <p className="text-sm text-gray-500">
                        Automatically sets up database, subdomain, and default configuration
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Export Package</CardTitle>
                      <CardDescription>
                        Generate self-hosted package
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Package
                      </Button>
                      <p className="text-sm text-gray-500">
                        Complete installation package for local deployment
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">API Integration</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <code className="text-sm">
                      curl -X POST https://api.metalingua.com/v1/institutes \<br/>
                      -H "Authorization: Bearer YOUR_API_KEY" \<br/>
                      -H "Content-Type: application/json" \<br/>
                      -d '{"name": "Institute Name", "subdomain": "institute-name"}'
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}