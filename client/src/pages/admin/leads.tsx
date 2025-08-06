import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { UserPlus, Phone, Mail, Target } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

export default function AdminLeadsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['/api/leads'],
  });

  const filteredLeads = leads.filter((lead: any) => {
    const matchesSearch = searchTerm === '' || 
      lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      accessorKey: 'name',
      header: t('admin:leads.name'),
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.firstName} {row.original.lastName}</div>
          <div className="text-sm text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: t('admin:leads.phone'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {row.original.phoneNumber}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('admin:leads.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          new: 'default',
          contacted: 'secondary',
          qualified: 'success',
          converted: 'success',
          lost: 'destructive',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'source',
      header: t('admin:leads.source'),
    },
    {
      accessorKey: 'interestedLanguage',
      header: t('admin:leads.interestedLanguage'),
    },
    {
      accessorKey: 'priority',
      header: t('admin:leads.priority'),
      cell: ({ row }: any) => {
        const priority = row.original.priority;
        const colors: any = {
          high: 'destructive',
          medium: 'secondary',
          low: 'default',
        };
        return <Badge variant={colors[priority] || 'default'}>{priority}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('admin:leads.title')}</h1>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('admin:leads.addLead')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.totalLeads')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.newLeads')}
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'new').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.qualified')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'qualified').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:leads.converted')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leads.filter((l: any) => l.status === 'converted').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t('admin:leads.leadsList')}</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder={t('admin:leads.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('admin:leads.filterByStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin:leads.allStatuses')}</SelectItem>
                  <SelectItem value="new">{t('admin:leads.new')}</SelectItem>
                  <SelectItem value="contacted">{t('admin:leads.contacted')}</SelectItem>
                  <SelectItem value="qualified">{t('admin:leads.qualified')}</SelectItem>
                  <SelectItem value="converted">{t('admin:leads.converted')}</SelectItem>
                  <SelectItem value="lost">{t('admin:leads.lost')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin:leads.name')}</TableHead>
                  <TableHead>{t('admin:leads.phone')}</TableHead>
                  <TableHead>{t('admin:leads.status')}</TableHead>
                  <TableHead>{t('admin:leads.source')}</TableHead>
                  <TableHead>{t('admin:leads.interestedLanguage')}</TableHead>
                  <TableHead>{t('admin:leads.priority')}</TableHead>
                  <TableHead>{t('admin:leads.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead: any) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.firstName} {lead.lastName}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {lead.phoneNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.status === 'new' ? 'default' :
                        lead.status === 'contacted' ? 'secondary' :
                        lead.status === 'qualified' || lead.status === 'converted' ? 'default' :
                        lead.status === 'lost' ? 'destructive' : 'default'
                      }>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{lead.source}</TableCell>
                    <TableCell>{lead.interestedLanguage}</TableCell>
                    <TableCell>
                      <Badge variant={
                        lead.priority === 'high' ? 'destructive' :
                        lead.priority === 'medium' ? 'secondary' : 'default'
                      }>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" variant="outline" className="p-1 sm:p-2">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-1 sm:p-2">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}