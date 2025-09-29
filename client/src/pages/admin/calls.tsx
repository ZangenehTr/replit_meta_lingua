import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Calendar } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminCallsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const { data: callLogs = [], isLoading } = useQuery({
    queryKey: ['/api/call-logs'],
  });

  // Calculate average duration from actual call logs (no hardcoded data)
  const calculateAverageDuration = () => {
    if (!callLogs.length) return '0:00';
    const totalSeconds = callLogs.reduce((acc: number, call: any) => {
      const [minutes, seconds] = (call.duration || '0:00').split(':').map(Number);
      return acc + (minutes * 60) + (seconds || 0);
    }, 0);
    const avgSeconds = Math.round(totalSeconds / callLogs.length);
    const mins = Math.floor(avgSeconds / 60);
    const secs = avgSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      accessorKey: 'timestamp',
      header: t('callcenter:calls.dateTime'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {new Date(row.original.timestamp).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'agentName',
      header: t('callcenter:calls.agent'),
      cell: ({ row }: any) => (
        <div className="font-medium">{row.original.agentName}</div>
      ),
    },
    {
      accessorKey: 'contactName',
      header: t('callcenter:calls.contact'),
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.original.contactName}</div>
          <div className="text-sm text-muted-foreground">{row.original.phoneNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: 'direction',
      header: t('callcenter:calls.direction'),
      cell: ({ row }: any) => {
        const direction = row.original.direction;
        return (
          <div className="flex items-center gap-2">
            {direction === 'inbound' ? (
              <>
                <PhoneIncoming className="h-4 w-4 text-green-500" />
                {t('callcenter:calls.inbound')}
              </>
            ) : (
              <>
                <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                {t('callcenter:calls.outbound')}
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'duration',
      header: t('callcenter:calls.duration'),
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {row.original.duration}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('callcenter:calls.status'),
      cell: ({ row }: any) => {
        const status = row.original.status;
        const colors: any = {
          completed: 'success',
          missed: 'destructive',
          busy: 'secondary',
          failed: 'destructive',
        };
        return <Badge variant={colors[status] || 'default'}>{status}</Badge>;
      },
    },
    {
      accessorKey: 'outcome',
      header: t('callcenter:calls.outcome'),
      cell: ({ row }: any) => {
        const outcome = row.original.outcome;
        const colors: any = {
          'Lead Qualified': 'success',
          'Follow-up Required': 'warning',
          'Not Interested': 'secondary',
          'Converted': 'success',
        };
        return outcome ? (
          <Badge variant={colors[outcome] || 'default'}>{outcome}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            {t('callcenter:calls.playRecording')}
          </Button>
          <Button size="sm" variant="outline">
            {t('callcenter:calls.viewDetails')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('callcenter:calls.title')}</h1>
        <Button onClick={() => setIsCallModalOpen(true)} data-testid="button-start-call">
          <Phone className="h-4 w-4 mr-2" />
          {t('callcenter:calls.makeCall')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:calls.totalCalls')}
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{callLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:calls.today')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:calls.inboundCalls')}
            </CardTitle>
            <PhoneIncoming className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {callLogs.filter((c: any) => c.direction === 'inbound').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:calls.received')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:calls.outboundCalls')}
            </CardTitle>
            <PhoneOutgoing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {callLogs.filter((c: any) => c.direction === 'outbound').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:calls.made')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('callcenter:calls.avgDuration')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageDuration()}</div>
            <p className="text-xs text-muted-foreground">
              {t('callcenter:calls.minutes')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('callcenter:calls.callHistory')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('callcenter:calls.subtitle')}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('common:loading')}</div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('callcenter:calls.dateTime')}</TableHead>
                  <TableHead>{t('callcenter:calls.agent')}</TableHead>
                  <TableHead>{t('callcenter:calls.contact')}</TableHead>
                  <TableHead>{t('callcenter:calls.direction')}</TableHead>
                  <TableHead>{t('callcenter:calls.duration')}</TableHead>
                  <TableHead>{t('callcenter:calls.status')}</TableHead>
                  <TableHead>{t('callcenter:calls.outcome')}</TableHead>
                  <TableHead>{t('callcenter:calls.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.agentName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.contactName}</div>
                        <div className="text-sm text-muted-foreground">{log.phoneNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.direction === 'inbound' ? (
                          <>
                            <PhoneIncoming className="h-4 w-4 text-green-500" />
                            {t('callcenter:calls.inbound')}
                          </>
                        ) : (
                          <>
                            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                            {t('callcenter:calls.outbound')}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {log.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        log.status === 'completed' ? 'default' :
                        log.status === 'missed' ? 'destructive' :
                        log.status === 'busy' ? 'secondary' :
                        log.status === 'failed' ? 'destructive' : 'default'
                      }>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.outcome ? (
                        <Badge variant={
                          log.outcome === 'Lead Qualified' || log.outcome === 'Converted' ? 'default' :
                          log.outcome === 'Follow-up Required' ? 'secondary' :
                          log.outcome === 'Not Interested' ? 'secondary' : 'default'
                        }>
                          {log.outcome}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('callcenter:calls.playRecording')}
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs sm:text-sm px-2 sm:px-3">
                          {t('callcenter:calls.viewDetails')}
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

      {/* Call Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('callcenter:calls.makeCall')}</DialogTitle>
            <DialogDescription>
              {t('callcenter:calls.enterPhoneNumber', 'Enter the phone number to call')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                {t('callcenter:calls.phoneNumber', 'Phone')}
              </Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="col-span-3"
                data-testid="input-phone-number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button 
              onClick={() => {
                // Here would be VoIP integration - for now just close modal
                setIsCallModalOpen(false);
                setPhoneNumber('');
              }}
              disabled={!phoneNumber.trim()}
              data-testid="button-place-call"
            >
              <Phone className="h-4 w-4 mr-2" />
              {t('callcenter:calls.placeCall', 'Place Call')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}