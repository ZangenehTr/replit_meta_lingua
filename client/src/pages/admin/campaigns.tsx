import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, TrendingUp, Users, Target, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';

export default function AdminCampaignsPage() {
  const { t } = useTranslation(['admin', 'common']);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['/api/admin/campaigns'],
  });

  // Calculate real metrics from actual campaign data (no hardcoded values)
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
  const totalLeads = campaigns.reduce((sum: number, c: any) => sum + (c.leads || 0), 0);
  const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
  const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0.0';
  const avgROI = campaigns.length > 0 ? 
    (campaigns.reduce((sum: number, c: any) => sum + (c.roi || 0), 0) / campaigns.length).toFixed(1) : '0.0';

  const columns = [
    {
      accessorKey: 'name',
      header: t('admin:campaigns.campaignName'),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: t('admin:campaigns.type'),
      cell: ({ row }: any) => (
        <Badge variant="outline">{row.original.type}</Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin:campaigns.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          active: 'success',
          paused: 'secondary',
          completed: 'default',
          draft: 'outline',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'leads',
      header: t('admin:campaigns.leads'),
      cell: ({ row }: any) => (
        <div className="text-center">{row.original.leads || 0}</div>
      ),
    },
    {
      accessorKey: 'conversions',
      header: t('admin:campaigns.conversions'),
      cell: ({ row }: any) => (
        <div className="text-center">{row.original.conversions || 0}</div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: t('admin:campaigns.startDate'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(row.original.startDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            {t('admin:campaigns.view')}
          </Button>
          <Button size="sm" variant="outline">
            {t('admin:campaigns.manage')}
          </Button>
        </div>
      ),
    },
  ];

  // Real data from API - no mock data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('admin:campaigns.title')}</h1>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin:campaigns.createNewCampaign')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.activeCampaigns')}
            </CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:campaigns.runningNow')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.totalLeads')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:campaigns.thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.conversionRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:campaigns.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:campaigns.roiByChannel')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgROI}x</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:campaigns.averageROI')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin:campaigns.campaignsList')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('admin:campaigns.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin:campaigns.name')}</TableHead>
                <TableHead>{t('admin:campaigns.type')}</TableHead>
                <TableHead>{t('admin:campaigns.status')}</TableHead>
                <TableHead>{t('admin:campaigns.startDate')}</TableHead>
                <TableHead>{t('admin:campaigns.endDate')}</TableHead>
                <TableHead>{t('admin:campaigns.leads')}</TableHead>
                <TableHead>{t('admin:campaigns.conversion')}</TableHead>
                <TableHead>{t('admin:campaigns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {t('common:loading')}
                  </TableCell>
                </TableRow>
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t('admin:campaigns.noCampaigns', 'No campaigns created yet')}
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign: any) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.type}</TableCell>
                    <TableCell>
                      <Badge variant={
                        campaign.status === 'active' ? 'default' :
                        campaign.status === 'scheduled' ? 'secondary' :
                        campaign.status === 'completed' ? 'outline' :
                        campaign.status === 'paused' ? 'destructive' : 'default'
                      }>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(campaign.startDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>{campaign.leads || 0}</TableCell>
                    <TableCell>{campaign.conversionRate || '0'}%</TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('admin:campaigns.edit')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('admin:campaigns.view')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin:campaigns.socialMediaIntegration')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('admin:campaigns.connectPlatforms')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{t('admin:campaigns.instagram')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('admin:campaigns.followers')}: 0
                </p>
              </div>
              <Button variant="outline">{t('admin:campaigns.manage')}</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">{t('admin:campaigns.telegram')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('admin:campaigns.members')}: 0
                </p>
              </div>
              <Button variant="outline">{t('admin:campaigns.manage')}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin:campaigns.campaignAnalytics')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('admin:campaigns.comprehensivePerformanceTracking')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('admin:campaigns.instagramEnrollment')}</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('admin:campaigns.googleAdsEnrollment')}</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('admin:campaigns.telegramEnrollment')}</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{t('admin:campaigns.referralEnrollment')}</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}