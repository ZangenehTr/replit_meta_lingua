import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
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
  const { t } = useTranslation(['admin', 'common']);
  const { language, isRTL, direction } = useLanguage();
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
      apiRequest('/api/admin/white-label/institutes', {
        method: 'POST',
        body: JSON.stringify(instituteData),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('admin:whiteLabel.createInstitute'),
        description: t('common:createdSuccessfully'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/white-label/institutes'] });
      setIsCreateModalOpen(false);
    },
  });

  // Update institute mutation
  const updateInstituteMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Institute> }) => 
      apiRequest(`/api/admin/white-label/institutes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      toast({
        title: t('common:updated'),
        description: t('common:updatedSuccessfully'),
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
            {t('admin:whiteLabel.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('common:manageInstitutes')}
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          {t('admin:whiteLabel.createInstitute')}
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:whiteLabel.institutes')}
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +3 {t('common:thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('common:totalRevenue')}
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,300,000 IRR</div>
            <p className="text-xs text-muted-foreground">
              +18% {t('common:fromLastMonth')}
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
              {t('admin:whiteLabel.successRate')}
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:whiteLabel.instituteSatisfaction')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="institutes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="institutes">{t('admin:whiteLabel.instituteOverview')}</TabsTrigger>
          <TabsTrigger value="branding">{t('admin:whiteLabel.brandingSettings')}</TabsTrigger>
          <TabsTrigger value="features">{t('admin:whiteLabel.featureManagement')}</TabsTrigger>
          <TabsTrigger value="deployment">{t('admin:whiteLabel.deploymentTools')}</TabsTrigger>
        </TabsList>

        <TabsContent value="institutes">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:whiteLabel.instituteManagement')}</CardTitle>
              <CardDescription>
                {t('admin:whiteLabel.manageDeployments')}
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
                            {institute.studentsCount} {t('admin:whiteLabel.students')}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">
                            {institute.teachersCount} {t('admin:whiteLabel.teachers')}
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
                        {institute.monthlyRevenue.toLocaleString()} {t('admin:whiteLabel.irrPerMonth')}
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
              <CardTitle>{t('admin:whiteLabel.customBranding')}</CardTitle>
              <CardDescription>
                {t('admin:whiteLabel.customizeAppearance')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label>{t('admin:whiteLabel.instituteLogo')}</Label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-600" />
                    </div>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('admin:whiteLabel.uploadLogo')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>{t('admin:whiteLabel.colorScheme')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">{t('admin:whiteLabel.primaryColor')}</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="color" value="#3B82F6" className="w-12 h-8" />
                        <Input value="#3B82F6" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">{t('admin:whiteLabel.secondaryColor')}</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="color" value="#6366F1" className="w-12 h-8" />
                        <Input value="#6366F1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>{t('admin:whiteLabel.customDomainSettings')}</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">{t('admin:whiteLabel.subdomain')}</Label>
                    <Input placeholder={t('admin:whiteLabel.subdomainPlaceholder')} />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('admin:whiteLabel.willCreate')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm">{t('admin:whiteLabel.customDomainOptional')}</Label>
                    <Input placeholder={t('admin:whiteLabel.customDomainPlaceholder')} />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('admin:whiteLabel.requiresDNS')}
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
              <CardTitle>{t('admin:whiteLabel.featureManagement')}</CardTitle>
              <CardDescription>
                {t('admin:whiteLabel.controlFeatures')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      plan: t('admin:whiteLabel.planBasic'),
                      price: `2,500,000 ${t('admin:whiteLabel.irrPerMonth')}`,
                      features: [
                        t('admin:whiteLabel.feature50Students'),
                        t('admin:whiteLabel.featureBasicCourses'),
                        t('admin:whiteLabel.featureEmailSupport'),
                        t('admin:whiteLabel.featureStandardBranding')
                      ]
                    },
                    {
                      plan: t('admin:whiteLabel.planProfessional'), 
                      price: `7,500,000 ${t('admin:whiteLabel.irrPerMonth')}`,
                      features: [
                        t('admin:whiteLabel.feature200Students'),
                        t('admin:whiteLabel.featureAdvancedAnalytics'),
                        t('admin:whiteLabel.featureSMSNotifications'),
                        t('admin:whiteLabel.featureCustomDomain'),
                        t('admin:whiteLabel.featurePrioritySupport')
                      ]
                    },
                    {
                      plan: t('admin:whiteLabel.planEnterprise'),
                      price: `15,000,000 ${t('admin:whiteLabel.irrPerMonth')}`,
                      features: [
                        t('admin:whiteLabel.featureUnlimitedStudents'),
                        t('admin:whiteLabel.featureAPIAccess'),
                        t('admin:whiteLabel.featureMultiLocation'),
                        t('admin:whiteLabel.featureCustomIntegrations'),
                        t('admin:whiteLabel.featureDedicatedSupport')
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
              <CardTitle>{t('admin:whiteLabel.deploymentTools')}</CardTitle>
              <CardDescription>
                {t('admin:whiteLabel.oneClickDeployment')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('admin:whiteLabel.quickDeploy')}</CardTitle>
                      <CardDescription>
                        {t('admin:whiteLabel.deployInMinutes')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        {t('admin:whiteLabel.oneClickDeployButton')}
                      </Button>
                      <p className="text-sm text-gray-500">
                        {t('admin:whiteLabel.automaticSetup')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('admin:whiteLabel.exportPackage')}</CardTitle>
                      <CardDescription>
                        {t('admin:whiteLabel.generateSelfHosted')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        {t('admin:whiteLabel.downloadPackage')}
                      </Button>
                      <p className="text-sm text-gray-500">
                        {t('admin:whiteLabel.completePackage')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">{t('admin:whiteLabel.apiIntegration')}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
{`curl -X POST https://api.metalingua.com/v1/institutes \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-H "Content-Type: application/json" \\
-d '{"name": "Institute Name", "subdomain": "institute-name"}'`}
                    </pre>
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