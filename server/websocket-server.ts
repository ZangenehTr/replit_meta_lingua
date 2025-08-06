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
}

interface TeacherSocket {
  socketId: string;
  teacherId: number;
  isAvailable: boolean;
  currentCall?: string;
}

export class CallernWebSocketServer {
  private io: SocketIOServer;
  private activeRooms: Map<string, CallRoom> = new Map();
  private teacherSockets: Map<number, TeacherSocket> = new Map();
  private studentSockets: Map<number, string> = new Map();

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
        
        if (role === 'teacher') {
          this.teacherSockets.set(userId, {
            socketId: socket.id,
            teacherId: userId,
            isAvailable: true,
          });
          
          // Update teacher availability in database
          await this.updateTeacherAvailability(userId, true);
          
          // Notify admin dashboard
          this.io.emit('teacher-status-update', {
            teacherId: userId,
            status: 'online',
          });
        } else if (role === 'student') {
          this.studentSockets.set(userId, socket.id);
        }
      });

      // Join room
      socket.on('join-room', (data) => {
        const { roomId, userId, role } = data;
        socket.join(roomId);
        
        // Add to room participants
        const room = this.activeRooms.get(roomId);
        if (room) {
          room.participants.add(socket.id);
        }
        
        console.log(`User ${userId} (${role}) joined room ${roomId}`);
      });

      // Handle call request from student
      socket.on('call-teacher', async (data) => {
        const { teacherId, studentId, packageId, language, roomId } = data;
        
        try {
          // Verify student has available minutes
          const hasMinutes = await this.verifyStudentPackage(studentId, packageId);
          if (!hasMinutes) {
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
          if (!teacherSocket || !teacherSocket.isAvailable || teacherSocket.currentCall) {
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
        
        const room = this.activeRooms.get(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join teacher to room
        socket.join(roomId);
        room.participants.add(socket.id);

        // Notify student that call was accepted
        const studentSocketId = this.studentSockets.get(studentId);
        if (studentSocketId) {
          this.io.to(studentSocketId).emit('call-accepted', {
            roomId,
            teacherId,
          });
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
      const studentPackage = await db
        .select()
        .from(studentCallernPackages)
        .where(
          and(
            eq(studentCallernPackages.studentId, studentId),
            eq(studentCallernPackages.packageId, packageId),
            eq(studentCallernPackages.status, 'active')
          )
        )
        .limit(1);

      if (!studentPackage.length) return false;

      const pkg = studentPackage[0];
      const remainingMinutes = pkg.totalHours * 60 - pkg.usedMinutes;
      
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
          and(
            eq(teacherCallernAvailability.isOnline, true),
            eq(teacherCallernAvailability.isAvailable, true)
          )
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
      const student = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1);

      return student[0] || null;
    } catch (error) {
      console.error('Error getting student info:', error);
      return null;
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