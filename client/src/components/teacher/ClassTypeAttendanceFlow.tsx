import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  QrCode, 
  Video, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';

interface ClassTypeAttendanceFlowProps {
  sessionId: number;
  onAttendanceUpdate?: () => void;
}

interface SessionDetails {
  sessionId: number;
  courseId: number;
  deliveryMode: string;
  classFormat: string;
  maxStudents: number;
  sessionTitle: string;
  scheduledAt: string;
  duration: number;
  teacherId: number;
  teacherName: string;
  classType: string;
  attendanceFlow: {
    autoTrack: boolean;
    methods: string[];
    checkInRequired: boolean;
    physicalCheckIn: boolean | string;
    lateThresholdMinutes: number;
    description: string;
  };
}

export default function ClassTypeAttendanceFlow({ sessionId, onAttendanceUpdate }: ClassTypeAttendanceFlowProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [qrCode, setQrCode] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Fetch session class type details
  const { data: sessionDetails } = useQuery<SessionDetails>({
    queryKey: ['session-class-type', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/class-type-details`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch session details');
      return response.json();
    },
    enabled: !!sessionId
  });

  // Fetch current attendance
  const { data: currentAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/active-attendance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    enabled: !!sessionId
  });

  // Initialize session attendance
  const initializeAttendance = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sessions/${sessionId}/start-attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to initialize attendance');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Attendance initialized for session' });
      refetchAttendance();
      onAttendanceUpdate?.();
    }
  });

  // Create physical check-in session
  const createPhysicalCheckIn = useMutation({
    mutationFn: async ({ roomNumber, qrCode }: { roomNumber?: string; qrCode?: string }) => {
      const response = await fetch(`/api/sessions/${sessionId}/physical-checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ roomNumber, qrCode })
      });
      if (!response.ok) throw new Error('Failed to create physical check-in');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Physical check-in created',
        description: `Room: ${data.roomNumber}, QR: ${data.qrCode}`
      });
      setQrCode(data.qrCode);
    }
  });

  // Process bulk attendance
  const processBulkAttendance = useMutation({
    mutationFn: async (attendanceData: Array<{ studentId: number; status: string; notes?: string }>) => {
      const response = await fetch(`/api/sessions/${sessionId}/bulk-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ attendanceData })
      });
      if (!response.ok) throw new Error('Failed to process bulk attendance');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Bulk attendance processed successfully' });
      refetchAttendance();
      onAttendanceUpdate?.();
      setSelectedStudents([]);
    }
  });

  const handleBulkAttendance = () => {
    if (selectedStudents.length === 0) {
      toast({ title: 'No students selected', variant: 'destructive' });
      return;
    }

    const attendanceData = selectedStudents.map(studentId => ({
      studentId,
      status: bulkStatus,
      notes: `Bulk marked as ${bulkStatus}`
    }));

    processBulkAttendance.mutate(attendanceData);
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const getClassTypeIcon = (classType: string) => {
    switch (classType) {
      case 'online_individual':
      case 'online_group':
      case 'callern_session':
        return <Video className="h-4 w-4" />;
      case 'in_person_individual':
      case 'in_person_group':
        return <MapPin className="h-4 w-4" />;
      case 'hybrid_class':
        return <Users className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!sessionDetails) {
    return <div>Loading session details...</div>;
  }

  return (
    <div className="space-y-6" data-testid="class-type-attendance-flow">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getClassTypeIcon(sessionDetails.classType)}
            {sessionDetails.sessionTitle}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {sessionDetails.classType.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="secondary">
              {sessionDetails.deliveryMode} - {sessionDetails.classFormat}
            </Badge>
            <Badge variant="outline">
              {sessionDetails.duration} minutes
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {sessionDetails.attendanceFlow.description}
          </p>
        </CardContent>
      </Card>

      {/* Attendance Flow Based on Class Type */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Attendance</TabsTrigger>
          <TabsTrigger value="actions">Mark Attendance</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Attendance</h3>
            <Button 
              onClick={() => initializeAttendance.mutate()}
              disabled={initializeAttendance.isPending}
              data-testid="button-initialize-attendance"
            >
              {initializeAttendance.isPending ? 'Initializing...' : 'Initialize Session'}
            </Button>
          </div>

          <div className="grid gap-2">
            {currentAttendance?.map((record: any) => (
              <Card key={record.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                      {record.studentName?.charAt(0)}
                    </div>
                    <span className="font-medium">{record.studentName}</span>
                    {sessionDetails.attendanceFlow.methods.includes('manual_bulk_marking') && (
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(record.studentId)}
                        onChange={() => toggleStudentSelection(record.studentId)}
                        className="ml-2"
                        data-testid={`checkbox-student-${record.studentId}`}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    <Badge variant={
                      record.status === 'present' ? 'default' :
                      record.status === 'late' ? 'secondary' : 'destructive'
                    }>
                      {record.status}
                    </Badge>
                    {record.checkInTime && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.checkInTime).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
                {record.notes && (
                  <p className="text-xs text-muted-foreground mt-2">{record.notes}</p>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {/* Online Classes - Automatic Tracking */}
          {sessionDetails.attendanceFlow.autoTrack && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Automatic Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Attendance is automatically tracked when students join the video call.
                  Manual override is available if needed.
                </p>
                {sessionDetails.attendanceFlow.methods.includes('manual_override') && (
                  <Button variant="outline" data-testid="button-manual-override">
                    Manual Override
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Physical Check-in Methods */}
          {sessionDetails.attendanceFlow.physicalCheckIn && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Physical Check-In
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room-number">Room Number</Label>
                    <Input
                      id="room-number"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g., Room 101"
                      data-testid="input-room-number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="qr-code">Custom QR Code (optional)</Label>
                    <Input
                      id="qr-code"
                      value={qrCode}
                      onChange={(e) => setQrCode(e.target.value)}
                      placeholder="Auto-generated if empty"
                      data-testid="input-qr-code"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => createPhysicalCheckIn.mutate({ roomNumber, qrCode })}
                  disabled={createPhysicalCheckIn.isPending}
                  data-testid="button-create-checkin"
                >
                  {createPhysicalCheckIn.isPending ? 'Creating...' : 'Create Check-In Session'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Bulk Attendance for Group Classes */}
          {sessionDetails.attendanceFlow.methods.includes('manual_bulk_marking') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Bulk Attendance Marking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <select 
                    value={bulkStatus} 
                    onChange={(e) => setBulkStatus(e.target.value as any)}
                    className="border rounded p-2"
                    data-testid="select-bulk-status"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                  <Button 
                    onClick={handleBulkAttendance}
                    disabled={selectedStudents.length === 0 || processBulkAttendance.isPending}
                    data-testid="button-bulk-attendance"
                  >
                    Mark {selectedStudents.length} Students as {bulkStatus}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select students from the Current Attendance tab, then use this bulk action.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Flow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Class Type:</strong> {sessionDetails.classType}
                </div>
                <div>
                  <strong>Auto Tracking:</strong> {sessionDetails.attendanceFlow.autoTrack ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Late Threshold:</strong> {sessionDetails.attendanceFlow.lateThresholdMinutes} minutes
                </div>
                <div>
                  <strong>Physical Check-in:</strong> {sessionDetails.attendanceFlow.physicalCheckIn ? 'Required' : 'Not Required'}
                </div>
              </div>
              <div>
                <strong>Available Methods:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sessionDetails.attendanceFlow.methods.map(method => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}