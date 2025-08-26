import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Video, Calendar, Clock, User, Play, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fa } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface CallHistory {
  id: number;
  studentId: number;
  teacherId: number;
  packageId: number;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  status: 'active' | 'completed' | 'cancelled';
  recordingUrl?: string;
  student?: { firstName: string; lastName: string };
  teacher?: { firstName: string; lastName: string };
  package?: { packageName: string };
}

export function CallernHistory() {
  const { t, i18n } = useTranslation();
  const [selectedRecording, setSelectedRecording] = useState<CallHistory | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  
  const { data: history = [], isLoading } = useQuery<CallHistory[]>({
    queryKey: ['/api/callern/call-history'],
  });

  const handlePlayRecording = (call: CallHistory) => {
    if (call.recordingUrl) {
      setSelectedRecording(call);
      // Construct full URL for video playback
      const fullUrl = `${window.location.origin}${call.recordingUrl}`;
      setVideoUrl(fullUrl);
    }
  };

  const handleDownloadRecording = (call: CallHistory) => {
    if (call.recordingUrl) {
      const link = document.createElement('a');
      link.href = `${window.location.origin}${call.recordingUrl}`;
      link.download = `callern-recording-${call.id}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const locale = i18n.language === 'fa' ? fa : undefined;
    return format(d, 'dd MMM yyyy', { locale });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return format(d, 'HH:mm');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t('callern.history', 'تاریخچه تماس‌ها')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t('callern.history', 'تاریخچه تماس‌ها')}
          </CardTitle>
          <CardDescription>
            {t('callern.historyDescription', 'مشاهده و دانلود ضبط‌های جلسات کالرن')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('callern.noHistory', 'هیچ تاریخچه‌ای یافت نشد')}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('callern.date', 'تاریخ')}</TableHead>
                    <TableHead>{t('callern.time', 'زمان')}</TableHead>
                    <TableHead>{t('callern.duration', 'مدت')}</TableHead>
                    <TableHead>{t('callern.teacher', 'معلم')}</TableHead>
                    <TableHead>{t('callern.status', 'وضعیت')}</TableHead>
                    <TableHead>{t('callern.recording', 'ضبط')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(call.startTime)}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatTime(call.startTime)}
                      </TableCell>
                      <TableCell>
                        {call.durationMinutes ? `${call.durationMinutes} ${t('minutes', 'دقیقه')}` : '-'}
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {call.teacher ? `${call.teacher.firstName} ${call.teacher.lastName}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          call.status === 'completed' ? 'success' :
                          call.status === 'active' ? 'default' :
                          'destructive'
                        }>
                          {t(`callern.status.${call.status}`, call.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.recordingUrl ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayRecording(call)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadRecording(call)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Video Player Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {t('callern.playbackTitle', 'پخش ضبط جلسه')}
            </DialogTitle>
            <DialogDescription>
              {selectedRecording && (
                <span>
                  {formatDate(selectedRecording.startTime)} - {formatTime(selectedRecording.startTime)}
                  {selectedRecording.teacher && (
                    <> | {t('callern.teacher', 'معلم')}: {selectedRecording.teacher.firstName} {selectedRecording.teacher.lastName}</>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
            {videoUrl && (
              <video 
                controls 
                autoPlay 
                className="w-full h-full"
                src={videoUrl}
              >
                {t('callern.videoNotSupported', 'مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.')}
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}