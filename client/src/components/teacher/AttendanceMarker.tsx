import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Users,
  AlertCircle
} from 'lucide-react';

interface AttendanceRecord {
  id: number | null;
  sessionId: number;
  studentId: number;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'not_marked';
  checkInTime: string | null;
  notes: string;
}

interface AttendanceMarkerProps {
  sessionId: number;
  sessionTitle?: string;
  isGroupClass?: boolean;
}

export function AttendanceMarker({ sessionId, sessionTitle, isGroupClass = false }: AttendanceMarkerProps) {
  const [selectedStudent, setSelectedStudent] = useState<AttendanceRecord | null>(null);
  const [notes, setNotes] = useState('');

  // Fetch attendance data for the session
  const { data: attendanceData = [], isLoading, refetch } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/teacher/sessions/${sessionId}/attendance`],
    enabled: !!sessionId
  });

  // Mark attendance mutation
  const markAttendance = useMutation({
    mutationFn: async ({ studentId, status, notes }: { studentId: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/teacher/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ studentId, status, notes })
      });
      if (!response.ok) throw new Error('Failed to mark attendance');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teacher/sessions/${sessionId}/attendance`] });
      toast({
        title: 'Success',
        description: 'Attendance marked successfully'
      });
      setSelectedStudent(null);
      setNotes('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive'
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const handleQuickMark = (studentId: number, status: 'present' | 'absent' | 'late') => {
    markAttendance.mutate({ studentId, status });
  };

  const handleDetailedMark = () => {
    if (selectedStudent) {
      markAttendance.mutate({
        studentId: selectedStudent.studentId,
        status: selectedStudent.status,
        notes
      });
    }
  };

  const attendanceStats = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'present').length,
    absent: attendanceData.filter(r => r.status === 'absent').length,
    late: attendanceData.filter(r => r.status === 'late').length,
    notMarked: attendanceData.filter(r => r.status === 'not_marked').length
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="attendance-marker">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isGroupClass ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
            Attendance - {sessionTitle || `Session ${sessionId}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>
        
        {/* Attendance Summary */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Present: {attendanceStats.present}
          </Badge>
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Absent: {attendanceStats.absent}
          </Badge>
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Late: {attendanceStats.late}
          </Badge>
          {attendanceStats.notMarked > 0 && (
            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              Not Marked: {attendanceStats.notMarked}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {attendanceData.map((record) => (
            <div 
              key={`${record.studentId}-${record.sessionId}`}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {record.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-medium">{record.studentName}</p>
                  {record.checkInTime && (
                    <p className="text-sm text-muted-foreground">
                      Check-in: {new Date(record.checkInTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(record.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(record.status)}
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </Badge>

                {record.status === 'not_marked' ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => handleQuickMark(record.studentId, 'present')}
                      disabled={markAttendance.isPending}
                      data-testid={`button-mark-present-${record.studentId}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-yellow-600 hover:bg-yellow-50"
                      onClick={() => handleQuickMark(record.studentId, 'late')}
                      disabled={markAttendance.isPending}
                      data-testid={`button-mark-late-${record.studentId}`}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleQuickMark(record.studentId, 'absent')}
                      disabled={markAttendance.isPending}
                      data-testid={`button-mark-absent-${record.studentId}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(record);
                          setNotes(record.notes || '');
                        }}
                        data-testid={`button-edit-attendance-${record.studentId}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Attendance - {record.studentName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <div className="flex gap-2 mt-2">
                            {(['present', 'late', 'absent'] as const).map((status) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={selectedStudent?.status === status ? "default" : "outline"}
                                onClick={() => setSelectedStudent(prev => prev ? { ...prev, status } : null)}
                                className="flex items-center gap-1"
                              >
                                {getStatusIcon(status)}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Notes</label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes about this student's attendance..."
                            className="mt-2"
                          />
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedStudent(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleDetailedMark}
                            disabled={markAttendance.isPending}
                          >
                            {markAttendance.isPending ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))}
        </div>

        {attendanceData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No students found for this session</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}