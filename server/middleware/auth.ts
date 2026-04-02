import jwt from "jsonwebtoken";
import { storage } from "../storage";

export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Real database implementation - lookup actual user from database
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        messageFa: '\u06a9\u0627\u0631\u0628\u0631 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'User account is inactive',
        messageFa: '\u062d\u0633\u0627\u0628 \u06a9\u0627\u0631\u0628\u0631\u06cc \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a'
      });
    }
    
    // Use real user data from database
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(403).json({ message: 'User not authenticated' });
    }
    
    // Normalize role comparison - handle both lowercase and capitalized versions
    const userRole = req.user.role.toLowerCase();
    const normalizedRoles = roles.map(r => r.toLowerCase());
    
    // Also handle special role mappings
    const roleMapping: { [key: string]: string[] } = {
      'admin': ['admin'],
      'supervisor': ['supervisor'],
      'teacher': ['teacher', 'teacher/tutor', 'tutor'],
      'teacher/tutor': ['teacher', 'teacher/tutor', 'tutor'],
      'student': ['student'],
      'mentor': ['mentor'],
      'callcenter': ['callcenter', 'call center agent'],
      'call center agent': ['callcenter', 'call center agent'],
      'accountant': ['accountant']
    };
    
    // Admin has superset access to everything for oversight
    // Check if user's role (or its mapped equivalents) matches any required role
    const userRoleEquivalents = roleMapping[userRole] || [userRole];
    const hasPermission = userRole === 'admin' || userRoleEquivalents.some(role => 
      normalizedRoles.includes(role)
    );
    
    if (!hasPermission) {
      console.log(`Role check failed: User role '${req.user.role}' not in required roles [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};
