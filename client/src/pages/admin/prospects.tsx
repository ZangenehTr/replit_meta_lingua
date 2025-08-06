import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Target, Plus, UserCheck, Clock, TrendingUp } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminProspectsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['/api/callcenter/prospects'],
  });

  const columns = [
    {
      accessorKey: 'name',
      header: t('callcenter:prospects.name'),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('callcenter:prospects.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          active: 'success',
          inactive: 'secondary',
          pending: 'warning',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'type',
      header: t('callcenter:prospects.type'),
    },
    {
      accessorKey: 'level',
      header: t('callcenter:prospects.level'),
    },
    {
      accessorKey: 'interest',
      header: t('callcenter:prospects.interest'),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            {t('callcenter:prospects.view')}
          </Button>
          <Button size="sm" variant="outline">
            {t('callcenter:prospects.contact')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('callcenter:prospects.title')}</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('callcenter:prospects.addProspect')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.totalProspects')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prospects.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.allStatuses')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.activeProspects')}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.readyToContact')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.pendingFollowUp')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.requiresAction')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:prospects.conversionRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:prospects.thisMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('callcenter:prospects.prospectsList')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('callcenter:prospects.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : prospects.length > 0 ? (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('callcenter:prospects.name')}</TableHead>
                  <TableHead>{t('callcenter:prospects.status')}</TableHead>
                  <TableHead>{t('callcenter:prospects.type')}</TableHead>
                  <TableHead>{t('callcenter:prospects.level')}</TableHead>
                  <TableHead>{t('callcenter:prospects.interest')}</TableHead>
                  <TableHead>{t('callcenter:prospects.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect: any) => (
                  <TableRow key={prospect.id}>
                    <TableCell className="font-medium">{prospect.name}</TableCell>
                    <TableCell>
                      <Badge variant={
                        prospect.status === 'active' ? 'default' :
                        prospect.status === 'inactive' ? 'secondary' :
                        prospect.status === 'pending' ? 'secondary' : 'default'
                      }>
                        {prospect.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{prospect.type}</TableCell>
                    <TableCell>{prospect.level}</TableCell>
                    <TableCell>{prospect.interest}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('callcenter:prospects.view')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('callcenter:prospects.contact')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('callcenter:prospects.noProspects')}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('callcenter:prospects.addNewProspect')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('callcenter:prospects.lastName')}</Label>
                <Input placeholder={t('callcenter:prospects.enterLastName')} />
              </div>
              <div>
                <Label>{t('callcenter:prospects.firstName')}</Label>
                <Input placeholder={t('callcenter:prospects.enterFirstName')} />
              </div>
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.phone')}</Label>
              <Input placeholder={t('callcenter:prospects.enterPhoneNumber')} />
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.email')}</Label>
              <Input type="email" placeholder={t('callcenter:prospects.enterEmailAddress')} />
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.interestedIn')}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="verbal" />
                  <label htmlFor="verbal">{t('callcenter:prospects.verbalWritingSkills')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="business" />
                  <label htmlFor="business">{t('callcenter:prospects.businessEnglish')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="grammar" />
                  <label htmlFor="grammar">{t('callcenter:prospects.grammarFocus')}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="listening" />
                  <label htmlFor="listening">{t('callcenter:prospects.listeningSkills')}</label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('callcenter:prospects.budgetRange')}</Label>
                <Input placeholder={t('callcenter:prospects.eg23MillionIRR')} />
              </div>
              <div>
                <Label>{t('callcenter:prospects.currentLevel')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('callcenter:prospects.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('callcenter:prospects.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('callcenter:prospects.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('callcenter:prospects.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>{t('callcenter:prospects.notes')}</Label>
              <Input placeholder={t('callcenter:prospects.whatSpecificCourses')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)}>
              {t('callcenter:prospects.addProspect')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}