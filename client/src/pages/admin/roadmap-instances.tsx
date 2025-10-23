import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Users, 
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function RoadmapInstances() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("active");
  const [filterStatus, setFilterStatus] = useState("all");

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-roadmap-instances">
            {t('admin:roadmapInstances', 'Roadmap Instances')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-roadmap-instances">
            {t('admin:roadmapInstancesDescription', 'Monitor and manage active learning roadmap instances for students')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40" data-testid="select-filter-status">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('admin:filterByStatus', 'Filter by status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin:allStatuses', 'All Statuses')}</SelectItem>
              <SelectItem value="active">{t('admin:active', 'Active')}</SelectItem>
              <SelectItem value="completed">{t('admin:completed', 'Completed')}</SelectItem>
              <SelectItem value="paused">{t('admin:paused', 'Paused')}</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-create-instance">
            <Plus className="h-4 w-4 mr-2" />
            {t('admin:assignRoadmap', 'Assign Roadmap')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-instances-label">
                  {t('admin:activeInstances', 'Active Instances')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-instances-value">127</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-completed-instances-label">
                  {t('admin:completedInstances', 'Completed Instances')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-completed-instances-value">89</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-completion-rate-label">
                  {t('admin:completionRate', 'Completion Rate')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-completion-rate-value">73%</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-at-risk-label">
                  {t('admin:atRiskInstances', 'At Risk')}
                </p>
                <p className="text-2xl font-bold text-red-600" data-testid="metric-at-risk-value">12</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" data-testid="tab-active-instances">
            <Play className="h-4 w-4 mr-2" />
            {t('admin:active', 'Active')}
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-instances">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('admin:completed', 'Completed')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-instance-analytics">
            <MapPin className="h-4 w-4 mr-2" />
            {t('admin:analytics', 'Analytics')}
          </TabsTrigger>
          <TabsTrigger value="management" data-testid="tab-instance-management">
            <Users className="h-4 w-4 mr-2" />
            {t('admin:management', 'Management')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-active-instances">
                {t('admin:activeRoadmapInstances', 'Active Roadmap Instances')}
              </CardTitle>
              <CardDescription>
                {t('admin:activeInstancesDescription', 'Students currently following assigned learning roadmaps')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { student: 'Sarah Johnson', roadmap: 'General English', progress: 67, status: 'On Track', daysActive: 23 },
                  { student: 'Ahmed Ali', roadmap: 'Business English', progress: 45, status: 'Lagging', daysActive: 31 },
                  { student: 'Maria Garcia', roadmap: 'IELTS Preparation', progress: 82, status: 'Ahead', daysActive: 19 },
                  { student: 'Chen Wei', roadmap: 'Conversation Skills', progress: 34, status: 'At Risk', daysActive: 42 }
                ].map((instance, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold" data-testid={`student-name-${index}`}>
                          {instance.student}
                        </h3>
                        <p className="text-sm text-gray-600" data-testid={`roadmap-name-${index}`}>
                          {instance.roadmap}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium" data-testid={`progress-${index}`}>
                          {instance.progress}%
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${instance.progress}%`}}
                            data-testid={`progress-bar-${index}`}
                          ></div>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          instance.status === 'On Track' ? 'default' : 
                          instance.status === 'Ahead' ? 'secondary' : 
                          instance.status === 'At Risk' ? 'destructive' : 'outline'
                        }
                        data-testid={`status-${index}`}
                      >
                        {instance.status}
                      </Badge>
                      <div className="text-sm text-gray-500" data-testid={`days-active-${index}`}>
                        {instance.daysActive} days
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" data-testid={`button-pause-${index}`}>
                          <Pause className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" data-testid={`button-reset-${index}`}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-completed-instances">
                {t('admin:completedInstances', 'Completed Roadmap Instances')}
              </CardTitle>
              <CardDescription>
                {t('admin:completedInstancesDescription', 'Students who have finished their assigned roadmaps')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-completed-loading">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingCompletedInstances', 'Loading completed instances...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-instance-analytics">
                {t('admin:instanceAnalytics', 'Instance Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:instanceAnalyticsDescription', 'Performance metrics and completion trends')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-analytics-loading">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingAnalytics', 'Loading analytics data...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-instance-management">
                {t('admin:instanceManagement', 'Instance Management')}
              </CardTitle>
              <CardDescription>
                {t('admin:instanceManagementDescription', 'Assign roadmaps and manage student enrollments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="select-student">{t('admin:selectStudent', 'Select Student')}</Label>
                    <Select>
                      <SelectTrigger data-testid="select-student">
                        <SelectValue placeholder={t('admin:chooseStudent', 'Choose student')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="ahmed">Ahmed Ali</SelectItem>
                        <SelectItem value="maria">Maria Garcia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="select-roadmap-template">{t('admin:selectRoadmapTemplate', 'Select Roadmap Template')}</Label>
                    <Select>
                      <SelectTrigger data-testid="select-roadmap-template">
                        <SelectValue placeholder={t('admin:chooseTemplate', 'Choose template')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General English</SelectItem>
                        <SelectItem value="business">Business English</SelectItem>
                        <SelectItem value="ielts">IELTS Preparation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button data-testid="button-assign-roadmap">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin:assignRoadmap', 'Assign Roadmap')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}