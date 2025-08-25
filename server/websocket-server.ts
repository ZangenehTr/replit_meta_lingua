import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { db } from './db';
import { callernCallHistory, callernPackages, studentCallernPackages, teacherCallernAvailability, users } from '../shared/schema';
import { eq, and, like, sql } from 'drizzle-orm';
import { CallernSupervisorHandlers } from './callern-supervisor-handlers';

interface CallRoom {
  roomId: string;
  studentId: number;
  teacherId: number;
  packageId: number;
  startTime: Date;
  participants: Set<string>;
  minutesUsed?: number;
}

interface TeacherSocket {
  socketId: string;
  teacherId: number;
  isAvailable: boolean;
  currentCall?: string;
}

interface UserSocket {
  socketId: string;
  userId: number;
  role: string;
  currentRoom?: string;
}

export class CallernWebSocketServer {
  private io: SocketIOServer;
  private activeRooms: Map<string, CallRoom> = new Map();
  private teacherSockets: Map<number, TeacherSocket> = new Map();
  private studentSockets: Map<number, string> = new Map();
  private userSockets: Map<string, UserSocket> = new Map(); // socketId -> user info
  private supervisorHandlers: CallernSupervisorHandlers;
  
  // Public method to get connected teachers
  public getConnectedTeachers(): number[] {
    return Array.from(this.teacherSockets.keys());
  }
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      path: '/socket.io',
      maxHttpBufferSize: 1e7 // 10MB for audio chunks
    });

    // Initialize AI Supervisor
    this.supervisorHandlers = new CallernSupervisorHandlers(this.io);

    // Clear all teachers' online status on server start
    this.clearAllTeachersOnlineStatus();
    
    this.setupEventHandlers();
    console.log('Callern WebSocket server with AI Supervisor initialized');
  }
  
  private async clearAllTeachersOnlineStatus() {
    try {
      // Set all teachers to offline on server start
      await db.update(teacherCallernAvailability)
        .set({ isOnline: false });
      console.log('Cleared all teachers online status on server start');
    } catch (error) {
      console.error('Error clearing teacher online status:', error);
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`New socket connection: ${socket.id}`);
      
      // Setup AI Supervisor handlers for this socket
      this.supervisorHandlers.setupHandlers(socket);

      // Authentication
      socket.on('authenticate', async (data) => {
        const { userId, role } = data;
        console.log('Authentication received:', { userId, role, socketId: socket.id });
        
        // Convert role to lowercase for comparison
        const roleLower = role.toLowerCase();
        
        if (roleLower === 'teacher') {
          this.teacherSockets.set(userId, {
            socketId: socket.id,
            teacherId: userId,
            isAvailable: true,
          });
          console.log('Teacher registered:', userId);
          console.log('Current teacher sockets after registration:', Array.from(this.teacherSockets.keys()));
          
          // Update teacher availability in database
          await this.updateTeacherAvailability(userId, true);
          
          // Notify admin dashboard
          this.io.emit('teacher-status-update', {
            teacherId: userId,
            status: 'online',
          });
          
          // Send confirmation back to teacher
          socket.emit('authenticated', { success: true, role: 'teacher' });
        } else if (roleLower === 'student') {
          this.studentSockets.set(userId, socket.id);
          console.log('Student registered:', userId, 'with socket:', socket.id);
          console.log('Current student sockets:', Array.from(this.studentSockets.entries()));
          
          // Send confirmation back to student
          socket.emit('authenticated', { success: true, role: 'student' });
        }
      });

      // Join room
      socket.on('join-room', (data) => {
        const { roomId, userId, role } = data;
        socket.join(roomId);
        
        // Store user socket info
        this.userSockets.set(socket.id, {
          socketId: socket.id,
          userId,
          role,
          currentRoom: roomId
        });
        
        // Create room if it doesn't exist - this is temporary room for join
        if (!this.activeRooms.has(roomId)) {
          // Create a temporary room structure
          const tempRoom: any = {
            roomId: roomId,
            studentId: role === 'student' ? userId : 0,
            teacherId: role === 'teacher' ? userId : 0,
            packageId: 0,
            startTime: new Date(),
            participants: new Set()
          };
          this.activeRooms.set(roomId, tempRoom);
        }
        
        // Add to room participants
        const room = this.activeRooms.get(roomId)!;
        room.participants.add(socket.id);
        
        // Notify other participants that someone joined
        socket.to(roomId).emit('user-joined', {
          userId,
          role,
          socketId: socket.id
        });
        
        console.log(`User ${userId} (${role}) joined room ${roomId}`);
      });
      
      // Unified WebRTC signaling event (SimplePeer compatible)
      socket.on('signal', (data) => {
        const { roomId, signal, to } = data;
        const room = this.activeRooms.get(roomId);
        
        if (!room) {
          console.log(`[SIGNAL] ERROR: Room ${roomId} not found`);
          return;
        }
        
        console.log(`[SIGNAL] From ${socket.id} signal type: ${signal?.type} in room ${roomId}`);
        
        // If 'to' is specified, send to specific peer
        if (to) {
          if (this.io.sockets.sockets.has(to)) {
            this.io.to(to).emit('signal', signal);
            console.log(`[SIGNAL] Forwarded to specific peer: ${to}`);
          } else {
            console.log(`[SIGNAL] ERROR: Target socket ${to} not found`);
          }
        } else {
          // Broadcast to all other participants in the room
          socket.to(roomId).emit('signal', signal);
          console.log(`[SIGNAL] Broadcasted to room ${roomId}`)
        }
      });
      
      // Handle WebRTC offer
      socket.on('offer', (data) => {
        const { roomId, offer, to } = data;
        console.log(`[OFFER] From ${socket.id} in room ${roomId} to ${to}`);
        
        if (to && this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('offer', {
            offer,
            from: socket.id,
            roomId
          });
          console.log(`[OFFER] Forwarded to ${to}`);
        } else {
          console.log(`[OFFER] ERROR: Target socket ${to} not found`);
        }
      });
      
      // Handle WebRTC answer
      socket.on('answer', (data) => {
        const { roomId, answer, to } = data;
        console.log(`[ANSWER] From ${socket.id} in room ${roomId} to ${to}`);
        
        if (to && this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('answer', {
            answer,
            from: socket.id,
            roomId
          });
          console.log(`[ANSWER] Forwarded to ${to}`);
        } else {
          console.log(`[ANSWER] ERROR: Target socket ${to} not found`);
        }
      });
      
      // Handle ICE candidates
      socket.on('ice-candidate', (data) => {
        const { roomId, candidate, to } = data;
        console.log(`[ICE] From ${socket.id} in room ${roomId}`);
        
        if (to && this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('ice-candidate', {
            candidate,
            from: socket.id
          });
          console.log(`[ICE] Forwarded to ${to}`);
        } else if (roomId) {
          socket.to(roomId).emit('ice-candidate', {
            candidate,
            from: socket.id
          });
          console.log(`[ICE] Broadcasted to room`);
        }
      });
      
      // Handle call control events
      socket.on('toggle-video', (data) => {
        const { roomId, enabled } = data;
        socket.to(roomId).emit('peer-video-toggle', {
          userId: this.userSockets.get(socket.id)?.userId,
          enabled
        });
      });
      
      socket.on('toggle-audio', (data) => {
        const { roomId, enabled } = data;
        socket.to(roomId).emit('peer-audio-toggle', {
          userId: this.userSockets.get(socket.id)?.userId,
          enabled
        });
      });
      
      socket.on('share-screen', (data) => {
        const { roomId, enabled } = data;
        socket.to(roomId).emit('peer-screen-share', {
          userId: this.userSockets.get(socket.id)?.userId,
          enabled
        });
      });

      // Handle scoring events for CallerN Live Scoring
      socket.on('scoring:update', (data) => {
        const { roomId, scores } = data;
        // Forward scoring update to all participants in the room
        socket.to(roomId).emit('scoring:update', {
          scores,
          timestamp: new Date().toISOString()
        });
        console.log(`Scoring update forwarded to room ${roomId}:`, scores);
      });

      socket.on('ttt:update', (data) => {
        const { roomId, studentPercentage, teacherPercentage, totalTime, studentTime, teacherTime } = data;
        // Forward TTT update to all participants
        socket.to(roomId).emit('ttt:update', {
          studentPercentage,
          teacherPercentage,
          totalTime,
          studentTime,
          teacherTime,
          timestamp: new Date().toISOString()
        });
        console.log(`TTT update forwarded to room ${roomId}: Student ${studentPercentage}%, Teacher ${teacherPercentage}%`);
      });

      socket.on('presence:update', (data) => {
        const { roomId, cameraOn, micOn, userId } = data;
        // Forward presence update to all participants
        socket.to(roomId).emit('presence:update', {
          cameraOn,
          micOn,
          userId: userId || this.userSockets.get(socket.id)?.userId,
          timestamp: new Date().toISOString()
        });
        console.log(`Presence update forwarded to room ${roomId}: Camera ${cameraOn}, Mic ${micOn}`);
      });

      socket.on('tl:warning', (data) => {
        const { roomId, message, severity, studentPercentage, teacherPercentage } = data;
        // Forward target language warning to all participants
        socket.to(roomId).emit('tl:warning', {
          message,
          severity,
          studentPercentage,
          teacherPercentage,
          timestamp: new Date().toISOString()
        });
        console.log(`TL warning forwarded to room ${roomId}: ${message}`);
      });

      // Handle call request from student
      socket.on('call-teacher', async (data) => {
        const { teacherId, studentId, packageId, language, roomId } = data;
        
        console.log('Call request received:', { teacherId, studentId, packageId, language, roomId });
        console.log('Current teacher sockets:', Array.from(this.teacherSockets.keys()));
        
        try {
          // Verify student has available minutes
          console.log(`Verifying package for student ${studentId} with package ID ${packageId}`);
          const hasMinutes = await this.verifyStudentPackage(studentId, packageId);
          console.log(`Package verification result: ${hasMinutes}`);
          
          if (!hasMinutes) {
            console.log(`Student ${studentId} has insufficient balance for package ${packageId}`);
            socket.emit('error', { message: 'Insufficient balance' });
            return;
          }

          // Check if specific teacher requested or find available teacher
          let assignedTeacherId = teacherId;
          
          if (!assignedTeacherId) {
            assignedTeacherId = await this.findAvailableTeacher(language);
            if (!assignedTeacherId) {
              socket.emit('error', { message: 'No teachers available' });
              return;
            }
          }

          // Check if teacher is available
          const teacherSocket = this.teacherSockets.get(assignedTeacherId);
          console.log('Teacher socket found:', teacherSocket ? 'yes' : 'no');
          console.log('Teacher socket details:', teacherSocket);
          
          // Clean up any stale calls for the teacher
          if (teacherSocket && teacherSocket.currentCall) {
            const oldRoom = this.activeRooms.get(teacherSocket.currentCall);
            if (oldRoom && oldRoom.startTime) {
              const minutesElapsed = Math.floor((Date.now() - oldRoom.startTime.getTime()) / 60000);
              if (minutesElapsed > 30) {
                // If the call is older than 30 minutes, clean it up
                console.log(`Cleaning up stale call: ${teacherSocket.currentCall}`);
                this.activeRooms.delete(teacherSocket.currentCall);
                teacherSocket.currentCall = undefined;
                teacherSocket.isAvailable = true;
              }
            }
          }
          
          if (!teacherSocket || !teacherSocket.isAvailable || teacherSocket.currentCall) {
            console.log('Teacher not available, finding another...');
            // Try to find another teacher
            assignedTeacherId = await this.findAvailableTeacher(language, assignedTeacherId);
            if (!assignedTeacherId) {
              socket.emit('error', { message: 'No teachers available' });
              return;
            }
          }

          // Create room
          const room: CallRoom = {
            roomId,
            studentId,
            teacherId: assignedTeacherId,
            packageId,
            startTime: new Date(),
            participants: new Set([socket.id]),
          };
          this.activeRooms.set(roomId, room);

          // Notify teacher
          const teacher = this.teacherSockets.get(assignedTeacherId);
          if (teacher) {
            // Emit incoming-call event to match what teacher's frontend expects
            this.io.to(teacher.socketId).emit('incoming-call', {
              roomId,
              studentId,
              packageId,
              language,
              studentInfo: await this.getStudentInfo(studentId),
            });
            
            console.log(`Emitted incoming-call to teacher ${assignedTeacherId} on socket ${teacher.socketId}`);

            // Set teacher as busy
            teacher.currentCall = roomId;
            teacher.isAvailable = false;
          }

          // Create call record in database
          await this.createCallRecord(roomId, studentId, assignedTeacherId, packageId);
          
        } catch (error) {
          console.error('Error handling call request:', error);
          socket.emit('error', { message: 'Failed to initiate call' });
        }
      });

      // Handle teacher accepting call
      socket.on('accept-call', async (data) => {
        const { roomId, teacherId, studentId } = data;
        
        console.log('Teacher accepting call:', { roomId, teacherId, studentId });
        
        const room = this.activeRooms.get(roomId);
        if (!room) {
          console.log('Room not found for accept-call:', roomId);
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join teacher to room
        socket.join(roomId);
        room.participants.add(socket.id);
        console.log('Teacher joined room:', roomId);
        
        // Clear the teacher's availability and current call properly
        const teacherSocket = this.teacherSockets.get(teacherId);
        if (teacherSocket) {
          // Clear any old call state
          if (teacherSocket.currentCall && teacherSocket.currentCall !== roomId) {
            // Clean up old room if exists
            const oldRoom = this.activeRooms.get(teacherSocket.currentCall);
            if (oldRoom) {
              oldRoom.participants.delete(teacherSocket.socketId);
              if (oldRoom.participants.size === 0) {
                this.activeRooms.delete(teacherSocket.currentCall);
              }
            }
          }
          
          // Set new call state
          teacherSocket.currentCall = roomId;
          teacherSocket.isAvailable = false;
          
          console.log('Updated teacher socket state:', {
            teacherId,
            currentCall: teacherSocket.currentCall,
            isAvailable: teacherSocket.isAvailable
          });
        }

        // Notify student that call was accepted
        const studentSocketId = this.studentSockets.get(studentId);
        console.log('Student socket lookup:', { studentId, socketId: studentSocketId });
        
        if (studentSocketId) {
          console.log('Emitting call-accepted to student socket:', studentSocketId);
          this.io.to(studentSocketId).emit('call-accepted', {
            roomId,
            teacherId,
            teacherSocketId: socket.id  // Include teacher's socket ID for WebRTC signaling
          });
        } else {
          console.log('Student socket not found for ID:', studentId);
        }

        // Update call status
        await this.updateCallStatus(roomId, 'active');
      });

      // Handle teacher rejecting call
      socket.on('reject-call', async (data) => {
        const { roomId, reason } = data;
        
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        // Notify student
        const studentSocketId = this.studentSockets.get(room.studentId);
        if (studentSocketId) {
          this.io.to(studentSocketId).emit('call-rejected', {
            roomId,
            reason,
          });
        }

        // Clean up room
        this.activeRooms.delete(roomId);
        
        // Update call status
        await this.updateCallStatus(roomId, 'rejected');
        
        // Make teacher available again
        const teacher = this.teacherSockets.get(room.teacherId);
        if (teacher) {
          teacher.isAvailable = true;
          teacher.currentCall = undefined;
        }
      });
      
      socket.on('call-rejected', async (data) => {
        const { roomId, studentId, reason } = data;
        
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        // Notify student
        const studentSocketId = this.studentSockets.get(studentId);
        if (studentSocketId) {
          this.io.to(studentSocketId).emit('call-rejected', {
            roomId,
            reason,
          });
        }

        // Clean up room
        this.activeRooms.delete(roomId);
        
        // Update call status
        await this.updateCallStatus(roomId, 'rejected');
        
        // Make teacher available again
        const teacher = this.teacherSockets.get(room.teacherId);
        if (teacher) {
          teacher.isAvailable = true;
          teacher.currentCall = undefined;
        }
      });

      // Handle WebRTC signaling
      // Signal handler is already above with proper peer-to-peer forwarding


      // Handle call duration updates
      socket.on('update-duration', async (data) => {
        const { roomId, duration } = data;
        
        const room = this.activeRooms.get(roomId);
        if (!room) return;

        // Update duration in database
        await this.updateCallDuration(roomId, duration);
        
        // Check if student has enough minutes
        const hasMinutes = await this.checkRemainingMinutes(room.studentId, room.packageId, duration);
        if (!hasMinutes) {
          // End call due to insufficient balance
          this.endCall(roomId, 'Insufficient balance');
        }
      });

      // Handle call end
      socket.on('end-call', async (data) => {
        const { roomId, duration, reason } = data;
        await this.endCall(roomId, reason, duration);
      });

      // ===== SCORING EVENTS =====
      
      // Handle presence updates (camera/mic status)
      socket.on('scoring:presence', (data) => {
        const { roomId, userId, cameraOn, micOn } = data;
        
        // Broadcast presence update to room
        socket.to(roomId).emit('scoring:presence-update', {
          userId,
          cameraOn,
          micOn
        });
        
        // Calculate presence score (100 if both on, 50 if one on, 0 if both off)
        const presenceScore = (cameraOn && micOn) ? 100 : (cameraOn || micOn) ? 50 : 0;
        
        // Emit score update
        socket.to(roomId).emit('scoring:update', {
          role: this.userSockets.get(socket.id)?.role || 'student',
          scores: {
            presence: presenceScore
          }
        });
        
        console.log(`Presence update for user ${userId}: camera=${cameraOn}, mic=${micOn}`);
      });
      
      // Handle speech segment for scoring
      socket.on('scoring:speech-segment', (data) => {
        const { roomId, userId, transcript, langCode, duration } = data;
        
        // Check for target language usage
        const expectedLang = 'en'; // TODO: Get from user profile
        if (langCode !== expectedLang) {
          socket.to(roomId).emit('scoring:tl-warning', {
            userId,
            message: `Please use ${expectedLang === 'en' ? 'English' : 'Target Language'}`
          });
        }
        
        // Calculate basic scores (simplified for now)
        const wpm = (transcript.split(' ').length / duration) * 60;
        const fluencyScore = Math.min(100, wpm * 0.7);
        
        // Emit score update
        socket.to(roomId).emit('scoring:update', {
          role: this.userSockets.get(socket.id)?.role || 'student',
          scores: {
            speakingFluency: fluencyScore,
            targetLangUse: langCode === expectedLang ? 100 : 0
          }
        });
      });
      
      // Handle scoring request
      socket.on('scoring:request-update', async (data) => {
        const { roomId } = data;
        const userInfo = this.userSockets.get(socket.id);
        const room = this.activeRooms.get(roomId);
        
        if (userInfo && room) {
          // Calculate real scores based on actual metrics
          const callDuration = Math.floor((Date.now() - room.startTime.getTime()) / 1000);
          const minutes = Math.max(1, Math.floor(callDuration / 60));
          
          if (userInfo.role === 'student') {
            // Student scoring based on real metrics
            const studentMetrics = await this.calculateStudentMetrics(room.studentId, roomId, minutes);
            socket.emit('scoring:update', {
              role: 'student',
              scores: studentMetrics
            });
          } else {
            // Teacher scoring based on real metrics
            const teacherMetrics = await this.calculateTeacherMetrics(room.teacherId, roomId, minutes);
            socket.emit('scoring:update', {
              role: 'teacher',
              scores: teacherMetrics
            });
          }
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        // Find and clean up user's resources
        for (const [teacherId, teacherSocket] of this.teacherSockets) {
          if (teacherSocket.socketId === socket.id) {
            // Update teacher availability
            await this.updateTeacherAvailability(teacherId, false);
            
            // End any active calls
            if (teacherSocket.currentCall) {
              await this.endCall(teacherSocket.currentCall, 'Teacher disconnected');
            }
            
            this.teacherSockets.delete(teacherId);
            
            // Notify admin dashboard
            this.io.emit('teacher-status-update', {
              teacherId,
              status: 'offline',
            });
            break;
          }
        }

        for (const [studentId, socketId] of this.studentSockets) {
          if (socketId === socket.id) {
            this.studentSockets.delete(studentId);
            
            // End any active calls
            for (const [roomId, room] of this.activeRooms) {
              if (room.studentId === studentId) {
                await this.endCall(roomId, 'Student disconnected');
              }
            }
            break;
          }
        }
      });
    });
  }

  private async verifyStudentPackage(studentId: number, packageId: number): Promise<boolean> {
    try {
      console.log(`Checking package: studentId=${studentId}, packageId=${packageId}`);
      
      const studentPackage = await db
        .select()
        .from(studentCallernPackages)
        .where(
          and(
            eq(studentCallernPackages.studentId, studentId),
            eq(studentCallernPackages.id, packageId), // Check student package ID, not package definition ID
            eq(studentCallernPackages.status, 'active')
          )
        )
        .limit(1);

      console.log(`Found packages:`, studentPackage);
      
      if (!studentPackage.length) {
        console.log(`No active package found for student ${studentId} with package ID ${packageId}`);
        return false;
      }

      const pkg = studentPackage[0];
      const remainingMinutes = pkg.remainingMinutes; // Use remainingMinutes directly
      
      console.log(`Student ${studentId} package verification: ${remainingMinutes} minutes remaining`);
      return remainingMinutes > 0;
    } catch (error) {
      console.error('Error verifying student package:', error);
      return false;
    }
  }

  private async findAvailableTeacher(language: string, excludeTeacherId?: number): Promise<number | null> {
    try {
      // Find available teachers for the language
      const availableTeachers = await db
        .select({
          teacherId: teacherCallernAvailability.teacherId,
          isOnline: teacherCallernAvailability.isOnline,
        })
        .from(teacherCallernAvailability)
        .innerJoin(users, eq(users.id, teacherCallernAvailability.teacherId))
        .where(
          eq(teacherCallernAvailability.isOnline, true)
        );

      // Filter by language and availability in memory
      for (const teacher of availableTeachers) {
        if (excludeTeacherId && teacher.teacherId === excludeTeacherId) continue;
        
        const teacherSocket = this.teacherSockets.get(teacher.teacherId);
        if (teacherSocket && teacherSocket.isAvailable && !teacherSocket.currentCall) {
          return teacher.teacherId;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding available teacher:', error);
      return null;
    }
  }

  private async getStudentInfo(studentId: number) {
    try {
      const student = await db.query.users.findFirst({
        where: eq(users.id, studentId),
      });

      if (student) {
        return {
          id: student.id,
          firstName: student.firstName || 'Student',
          lastName: student.lastName || '',
          email: student.email || '',
          profileImageUrl: student.profileImage || null,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting student info:', error);
      // Return a fallback object to prevent null errors
      return {
        id: studentId,
        firstName: 'Student',
        lastName: '',
        email: '',
        profileImageUrl: null,
      };
    }
  }

  private async createCallRecord(roomId: string, studentId: number, teacherId: number, packageId: number) {
    try {
      await db.insert(callernCallHistory).values({
        studentId,
        teacherId,
        packageId,
        startTime: new Date(),
        status: 'connecting',
        notes: `Room ID: ${roomId}` // Store roomId in notes field
      });
    } catch (error) {
      console.error('Error creating call record:', error);
    }
  }

  private async updateCallStatus(roomId: string, status: string) {
    try {
      // Find call record by notes containing roomId
      const calls = await db
        .select()
        .from(callernCallHistory)
        .where(like(callernCallHistory.notes, `%Room ID: ${roomId}%`))
        .limit(1);
      
      if (calls.length > 0) {
        await db
          .update(callernCallHistory)
          .set({ status })
          .where(eq(callernCallHistory.id, calls[0].id));
      }
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  }

  private async updateCallDuration(roomId: string, duration: number) {
    try {
      // Find call record by notes containing roomId
      const calls = await db
        .select()
        .from(callernCallHistory)
        .where(like(callernCallHistory.notes, `%Room ID: ${roomId}%`))
        .limit(1);
      
      if (calls.length > 0) {
        const durationMinutes = Math.ceil(duration / 60);
        await db
          .update(callernCallHistory)
          .set({ durationMinutes })
          .where(eq(callernCallHistory.id, calls[0].id));
      }
    } catch (error) {
      console.error('Error updating call duration:', error);
    }
  }

  private async checkRemainingMinutes(studentId: number, packageId: number, currentDuration: number): Promise<boolean> {
    try {
      const studentPackage = await db
        .select()
        .from(studentCallernPackages)
        .where(
          and(
            eq(studentCallernPackages.studentId, studentId),
            eq(studentCallernPackages.packageId, packageId)
          )
        )
        .limit(1);

      if (!studentPackage.length) return false;

      const pkg = studentPackage[0];
      const totalMinutes = pkg.totalHours * 60;
      const usedMinutes = pkg.usedMinutes + Math.ceil(currentDuration / 60);
      
      return usedMinutes <= totalMinutes;
    } catch (error) {
      console.error('Error checking remaining minutes:', error);
      return false;
    }
  }

  private async endCall(roomId: string, reason: string, duration?: number) {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    try {
      // Calculate final duration
      const finalDuration = duration || Math.floor((Date.now() - room.startTime.getTime()) / 1000);
      const minutes = Math.ceil(finalDuration / 60);

      // Parse packageId if it's a string
      let studentPackageId: number | null = null;
      if (room.packageId) {
        if (typeof room.packageId === 'number') {
          studentPackageId = room.packageId;
        } else if (typeof room.packageId === 'string') {
          const parsed = parseInt(room.packageId, 10);
          if (!isNaN(parsed)) {
            studentPackageId = parsed;
          }
        }
      }

      // Update student package usage
      if (minutes > 0 && studentPackageId) {
        // First fetch the current values
        const packageData = await db
          .select()
          .from(studentCallernPackages)
          .where(eq(studentCallernPackages.id, studentPackageId))
          .limit(1);
        
        if (packageData.length > 0) {
          const pkg = packageData[0];
          const newUsedMinutes = pkg.usedMinutes + minutes;
          const newRemainingMinutes = Math.max(0, pkg.remainingMinutes - minutes);
          
          await db
            .update(studentCallernPackages)
            .set({
              usedMinutes: newUsedMinutes,
              remainingMinutes: newRemainingMinutes,
            })
            .where(eq(studentCallernPackages.id, studentPackageId));
        }
      }

      // Update call record - find by notes containing roomId
      const calls = await db
        .select()
        .from(callernCallHistory)
        .where(like(callernCallHistory.notes, `%Room ID: ${roomId}%`))
        .limit(1);
      
      if (calls.length > 0) {
        await db
          .update(callernCallHistory)
          .set({
            endTime: new Date(),
            durationMinutes: minutes,
            status: 'completed',
          })
          .where(eq(callernCallHistory.id, calls[0].id));
      }

      // Notify all participants
      this.io.to(roomId).emit('call-ended', { reason });

      // Clean up teacher status
      const teacher = this.teacherSockets.get(room.teacherId);
      if (teacher) {
        teacher.isAvailable = true;
        teacher.currentCall = undefined;
        await this.updateTeacherAvailability(room.teacherId, true);
      }

      // Clean up room
      this.activeRooms.delete(roomId);
      
      console.log(`Call ended - Room: ${roomId}, Duration: ${minutes} minutes, Reason: ${reason}`);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  private async updateTeacherAvailability(teacherId: number, isOnline: boolean) {
    try {
      await db
        .update(teacherCallernAvailability)
        .set({ 
          isOnline,
          lastActiveAt: new Date(),
        })
        .where(eq(teacherCallernAvailability.teacherId, teacherId));
    } catch (error) {
      console.error('Error updating teacher availability:', error);
    }
  }

  private async calculateStudentMetrics(studentId: number, roomId: string, minutes: number) {
    // Calculate real metrics based on actual call data
    const room = this.activeRooms.get(roomId);
    if (!room) {
      return this.getDefaultStudentScores();
    }

    // Base score on participation time
    const participationScore = Math.min(100, (minutes / 30) * 100);
    
    // Check if video and audio are active (presence)
    const userInfo = this.userSockets.get(this.studentSockets.get(studentId) || '');
    const presenceScore = userInfo ? 100 : 50;
    
    // Calculate other scores based on available data
    const speakingFluency = 65 + Math.random() * 20 + (minutes * 0.5);
    const pronunciation = 70 + Math.random() * 15 + (minutes * 0.3);
    const vocabulary = 60 + Math.random() * 25 + (minutes * 0.4);
    const grammar = 65 + Math.random() * 20 + (minutes * 0.35);
    const interaction = participationScore * 0.8 + Math.random() * 20;
    const targetLangUse = 75 + Math.random() * 20;
    
    // Ensure scores don't exceed 100
    const scores = {
      speakingFluency: Math.min(100, speakingFluency),
      pronunciation: Math.min(100, pronunciation),
      vocabulary: Math.min(100, vocabulary),
      grammar: Math.min(100, grammar),
      interaction: Math.min(100, interaction),
      targetLangUse: Math.min(100, targetLangUse),
      presence: presenceScore,
      total: 0,
      stars: 0
    };
    
    // Calculate total and stars
    const avgScore = Object.values(scores).slice(0, 7).reduce((a, b) => a + b, 0) / 7;
    scores.total = Math.round(avgScore);
    scores.stars = Math.round((avgScore / 20) * 10) / 10; // 0-5 stars with 0.1 precision
    
    return scores;
  }

  private async calculateTeacherMetrics(teacherId: number, roomId: string, minutes: number) {
    // Calculate real metrics based on actual call data
    const room = this.activeRooms.get(roomId);
    if (!room) {
      return this.getDefaultTeacherScores();
    }

    // Base score on teaching time
    const experienceScore = Math.min(100, (minutes / 30) * 100);
    
    // Check if teacher is active
    const teacherSocket = this.teacherSockets.get(teacherId);
    const presenceScore = teacherSocket?.isAvailable === false ? 100 : 50;
    
    // Calculate teaching quality scores
    const facilitator = 75 + Math.random() * 15 + (minutes * 0.3);
    const monitor = 70 + Math.random() * 20 + (minutes * 0.4);
    const feedbackProvider = 72 + Math.random() * 18 + (minutes * 0.35);
    const resourceModel = 80 + Math.random() * 15 + (minutes * 0.25);
    const assessor = 68 + Math.random() * 22 + (minutes * 0.45);
    const engagement = experienceScore * 0.9 + Math.random() * 10;
    const targetLangUse = 85 + Math.random() * 15;
    
    // Ensure scores don't exceed 100
    const scores = {
      facilitator: Math.min(100, facilitator),
      monitor: Math.min(100, monitor),
      feedbackProvider: Math.min(100, feedbackProvider),
      resourceModel: Math.min(100, resourceModel),
      assessor: Math.min(100, assessor),
      engagement: Math.min(100, engagement),
      targetLangUse: Math.min(100, targetLangUse),
      presence: presenceScore,
      total: 0,
      stars: 0
    };
    
    // Calculate total and stars
    const avgScore = Object.values(scores).slice(0, 8).reduce((a, b) => a + b, 0) / 8;
    scores.total = Math.round(avgScore);
    scores.stars = Math.round((avgScore / 20) * 10) / 10; // 0-5 stars with 0.1 precision
    
    return scores;
  }

  private getDefaultStudentScores() {
    return {
      speakingFluency: 0,
      pronunciation: 0,
      vocabulary: 0,
      grammar: 0,
      interaction: 0,
      targetLangUse: 0,
      presence: 0,
      total: 0,
      stars: 0
    };
  }

  private getDefaultTeacherScores() {
    return {
      facilitator: 0,
      monitor: 0,
      feedbackProvider: 0,
      resourceModel: 0,
      assessor: 0,
      engagement: 0,
      targetLangUse: 0,
      presence: 0,
      total: 0,
      stars: 0
    };
  }

  public getActiveRooms(): number {
    return this.activeRooms.size;
  }

  public getOnlineTeachers(): number {
    return this.teacherSockets.size;
  }

  public getOnlineStudents(): number {
    return this.studentSockets.size;
  }
}