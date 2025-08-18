import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import { db } from './db';
import { callernCallHistory, callernPackages, studentCallernPackages, teacherCallernAvailability, users } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

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
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: true,
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupEventHandlers();
    console.log('Callern WebSocket server initialized');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`New socket connection: ${socket.id}`);

      // Authentication
      socket.on('authenticate', async (data) => {
        const { userId, role } = data;
        console.log('Authentication received:', { userId, role, socketId: socket.id });
        
        if (role === 'teacher') {
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
        } else if (role === 'student') {
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
        
        // Create room if it doesn't exist
        if (!this.activeRooms.has(roomId)) {
          this.activeRooms.set(roomId, {
            id: roomId,
            type: 'video',
            participants: new Set(),
            createdAt: new Date()
          });
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
      
      // WebRTC Signaling Events
      socket.on('offer', (data) => {
        const { roomId, offer, to } = data;
        console.log(`[OFFER] From ${socket.id} to ${to} in room ${roomId}`);
        console.log(`[OFFER] Target socket exists: ${this.io.sockets.sockets.has(to)}`);
        
        if (this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('offer', {
            offer,
            from: socket.id,
            roomId
          });
          console.log(`[OFFER] Successfully forwarded to ${to}`);
        } else {
          console.log(`[OFFER] ERROR: Target socket ${to} not found`);
        }
      });
      
      socket.on('answer', (data) => {
        const { roomId, answer, to } = data;
        console.log(`[ANSWER] From ${socket.id} to ${to} in room ${roomId}`);
        console.log(`[ANSWER] Target socket exists: ${this.io.sockets.sockets.has(to)}`);
        
        if (this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('answer', {
            answer,
            from: socket.id,
            roomId
          });
          console.log(`[ANSWER] Successfully forwarded to ${to}`);
        } else {
          console.log(`[ANSWER] ERROR: Target socket ${to} not found`);
        }
      });
      
      socket.on('ice-candidate', (data) => {
        const { roomId, candidate, to } = data;
        console.log(`[ICE] From ${socket.id} to ${to}`);
        
        if (this.io.sockets.sockets.has(to)) {
          this.io.to(to).emit('ice-candidate', {
            candidate,
            from: socket.id,
            roomId
          });
          console.log(`[ICE] Successfully forwarded to ${to}`);
        } else {
          console.log(`[ICE] ERROR: Target socket ${to} not found`);
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
          
          if (!teacherSocket || !teacherSocket.isAvailable || teacherSocket.currentCall) {
            console.log('Teacher not available, finding another...');
            // Try to find another teacher
            assignedTeacherId = await this.findAvailableTeacher(language, assignedTeacherId);
            if (!assignedTeacherId) {
              socket.emit('error', { message: 'Teacher is busy' });
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
            this.io.to(teacher.socketId).emit('call-request', {
              roomId,
              studentId,
              packageId,
              language,
              studentInfo: await this.getStudentInfo(studentId),
            });

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

        // Notify student that call was accepted
        const studentSocketId = this.studentSockets.get(studentId);
        console.log('Student socket lookup:', { studentId, socketId: studentSocketId });
        
        if (studentSocketId) {
          console.log('Emitting call-accepted to student socket:', studentSocketId);
          this.io.to(studentSocketId).emit('call-accepted', {
            roomId,
            teacherId,
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

      // Handle WebRTC signaling
      socket.on('signal', (data) => {
        const { roomId, signal } = data;
        
        // Broadcast signal to other participants in room
        socket.to(roomId).emit('signal', signal);
      });

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
          profileImageUrl: student.profileImageUrl || null,
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
        roomId,
      });
    } catch (error) {
      console.error('Error creating call record:', error);
    }
  }

  private async updateCallStatus(roomId: string, status: string) {
    try {
      await db
        .update(callernCallHistory)
        .set({ status })
        .where(eq(callernCallHistory.roomId, roomId));
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  }

  private async updateCallDuration(roomId: string, duration: number) {
    try {
      await db
        .update(callernCallHistory)
        .set({ duration })
        .where(eq(callernCallHistory.roomId, roomId));
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

      // Update student package usage
      if (minutes > 0) {
        await db
          .update(studentCallernPackages)
          .set({
            usedMinutes: studentCallernPackages.usedMinutes + minutes,
            remainingMinutes: studentCallernPackages.remainingMinutes - minutes,
          })
          .where(
            and(
              eq(studentCallernPackages.studentId, room.studentId),
              eq(studentCallernPackages.packageId, room.packageId)
            )
          );
      }

      // Update call record
      await db
        .update(callernCallHistory)
        .set({
          endTime: new Date(),
          duration: finalDuration,
          status: 'completed',
        })
        .where(eq(callernCallHistory.roomId, roomId));

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
          lastSeenAt: new Date(),
        })
        .where(eq(teacherCallernAvailability.teacherId, teacherId));
    } catch (error) {
      console.error('Error updating teacher availability:', error);
    }
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