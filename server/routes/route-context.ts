export interface RouteContext {
  authenticateToken: (req: any, res: any, next: any) => Promise<void>;
  requireRole: (roles: string[]) => (req: any, res: any, next: any) => void;
  downloadedModels: string[];
  setDownloadedModels: (models: string[]) => void;
  trainingData: Map<string, Map<string, string[]>>;
  upload: any;
  uploadVideo: any;
  uploadPhoto: any;
  audioUpload: any;
  uploadStudentPhoto: any;
  smsRateLimit: any;
  smsBulkRateLimit: any;
  otpRequestRateLimit: any;
  otpVerifyRateLimit: any;
  checkIdempotency: (req: any, res: any, next: any) => Promise<void>;
  productionGateMiddleware: (req: any, res: any, next: any) => void;
  calculateStudentAttendance: (studentId: number) => Promise<number>;
  getLastActivityTime: (userId: number) => Promise<string>;
  calculateTeacherRating: (teacherId: number) => Promise<string>;
  calculateOverallTeacherSatisfaction: () => Promise<number>;
  sendSmsSchema: any;
  sendBulkSmsSchema: any;
  sendTestSmsSchema: any;
}
