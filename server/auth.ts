import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { User, UserSession, InsertUserSession } from '@shared/schema';

// Critical security: JWT_SECRET must be provided via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required but not set. Application cannot start.');
  process.exit(1);
}
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
  session?: UserSession;
}

// Generate JWT tokens
export function generateTokens(user: User): { accessToken: string; refreshToken: string } {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  return { accessToken, refreshToken };
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await storage.getUser(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Check if session exists and is active
    const session = await storage.getUserSession(token);
    if (!session || !session.isActive) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    // Update last active time
    await storage.updateUserSessionActivity(session.id);

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

// Role-based authorization middleware
export function authorize(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Admin has superset access to everything
    if (req.user.role === 'Admin' || allowedRoles.includes(req.user.role)) {
      next();
      return;
    }
    
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}

// Permission-based authorization middleware
export function authorizePermission(resource: string, action: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = await storage.checkUserPermission(req.user.role, resource, action);
    if (!hasPermission) {
      return res.status(403).json({ error: `Permission denied for ${action} on ${resource}` });
    }

    next();
  };
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await storage.getUser(decoded.userId);
        if (user && user.isActive) {
          const session = await storage.getUserSession(token);
          if (session && session.isActive) {
            await storage.updateUserSessionActivity(session.id);
            req.user = user;
            req.session = session;
          }
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication on error
    next();
  }
}

// Create user session
export async function createUserSession(
  userId: number, 
  accessToken: string, 
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserSession> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

  const sessionData: InsertUserSession = {
    userId,
    token: accessToken,
    refreshToken,
    expiresAt,
    ipAddress,
    userAgent,
    isActive: true
  };

  return storage.createUserSession(sessionData);
}

// Logout user (invalidate session)
export async function logoutUser(token: string): Promise<void> {
  await storage.invalidateUserSession(token);
}

// Refresh token
export async function refreshUserToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return null;
    }

    const user = await storage.getUser(decoded.userId);
    if (!user || !user.isActive) {
      return null;
    }

    const session = await storage.getUserSessionByRefreshToken(refreshToken);
    if (!session || !session.isActive) {
      return null;
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    
    // Update session with new tokens
    await storage.updateUserSessionTokens(session.id, tokens.accessToken, tokens.refreshToken);

    return tokens;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}