import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import type { IStorage } from '../storage';

// Create router for admin user management
export function createAdminUsersRouter(storage: IStorage, authenticate: any, requireRole: any): express.Router {
  const router = express.Router();

  // Apply authentication and admin role requirement to all routes
  router.use(authenticate);
  router.use(requireRole(['Admin']));

  // Validation schemas
  const createUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.string().min(1),
    phoneNumber: z.string().optional(),
    password: z.string().min(6)
  });

  const updateUserSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    phoneNumber: z.string().optional(),
    isActive: z.boolean().optional()
  });

  // GET /api/admin/users - List all users
  router.get('/users', async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Filter out password hashes and format response
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        phoneNumber: user.phoneNumber || '',
        isActive: user.isActive !== false,
        createdAt: user.createdAt || new Date().toISOString()
      }));

      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // POST /api/admin/users - Create new user
  router.post('/users', async (req: any, res) => {
    try {
      // Validate request body
      const validatedData = createUserSchema.parse(req.body);

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Email already exists. Please use a different email address.' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user with basic required fields first
      const userData: any = {
        email: validatedData.email,
        password: hashedPassword
      };

      // Then update with additional fields
      const newUserData = {
        ...userData,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        phoneNumber: validatedData.phoneNumber || null,
        isActive: true
      };

      const newUser = await storage.createUser(newUserData);

      // Return user without password
      const sanitizedUser = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName || '',
        lastName: newUser.lastName || '',
        role: newUser.role,
        phoneNumber: newUser.phoneNumber || '',
        isActive: newUser.isActive !== false,
        createdAt: newUser.createdAt || new Date().toISOString()
      };

      res.status(201).json(sanitizedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // PUT /api/admin/users/:id - Update user
  router.put('/users/:id', async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Validate request body
      const validatedData = updateUserSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // If email is being updated, check for duplicates
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const emailExists = await storage.getUserByEmail(validatedData.email);
        if (emailExists) {
          return res.status(409).json({ 
            message: 'Email already exists. Please use a different email address.' 
          });
        }
      }

      // Update user
      const updatedUser = await storage.updateUser(userId, validatedData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update user' });
      }

      // Return user without password
      const sanitizedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName || '',
        lastName: updatedUser.lastName || '',
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber || '',
        isActive: updatedUser.isActive !== false,
        createdAt: updatedUser.createdAt || new Date().toISOString()
      };

      res.json(sanitizedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid request data',
          errors: error.errors 
        });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // DELETE /api/admin/users/:id - Delete user
  router.delete('/users/:id', async (req: any, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      // Check if user exists
      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deleting own account
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Delete user
      await storage.deleteUser(userId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // GET /api/admin/user-roles - Get available roles
  router.get('/user-roles', async (req: any, res) => {
    try {
      // Define available roles with display properties
      const roles = [
        { name: 'Admin', value: 'Admin', colorClass: 'bg-red-100 text-red-800' },
        { name: 'Student', value: 'Student', colorClass: 'bg-blue-100 text-blue-800' },
        { name: 'Teacher', value: 'Teacher', colorClass: 'bg-green-100 text-green-800' },
        { name: 'Mentor', value: 'Mentor', colorClass: 'bg-purple-100 text-purple-800' },
        { name: 'Supervisor', value: 'Supervisor', colorClass: 'bg-orange-100 text-orange-800' },
        { name: 'CallCenter', value: 'CallCenter', colorClass: 'bg-yellow-100 text-yellow-800' },
        { name: 'FrontDesk', value: 'FrontDesk', colorClass: 'bg-indigo-100 text-indigo-800' },
        { name: 'Accountant', value: 'Accountant', colorClass: 'bg-gray-100 text-gray-800' }
      ];

      res.json(roles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ message: 'Failed to fetch user roles' });
    }
  });

  return router;
}