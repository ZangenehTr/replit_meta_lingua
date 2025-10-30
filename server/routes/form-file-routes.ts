/**
 * Form File Upload Routes
 * 
 * Handles file uploads, retrieval, and deletion for DynamicForm system
 */

import { Express } from 'express';
import {
  createFormFileUploader,
  getFileMetadata,
  getFormFile,
  deleteFormFile
} from '../services/form-file-service.js';

export function registerFormFileRoutes(app: Express, authenticateToken: any) {
  
  // Upload file for form field
  app.post("/api/form-files/upload", authenticateToken, async (req: any, res) => {
    try {
      const { subfolder, allowedTypes, maxSize, multiple, maxFiles } = req.body;

      // Parse configuration from request
      const config = {
        subfolder: subfolder || 'general',
        allowedTypes: allowedTypes ? (typeof allowedTypes === 'string' ? JSON.parse(allowedTypes) : allowedTypes) : undefined,
        maxSize: maxSize ? parseInt(maxSize) : undefined,
        multiple: multiple === 'true' || multiple === true,
        maxFiles: maxFiles ? parseInt(maxFiles) : 10
      };

      // Create uploader with options
      const uploader = createFormFileUploader(config);

      // Execute upload
      uploader(req, res, (err: any) => {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json({ 
            error: 'File upload failed', 
            message: err.message 
          });
        }

        // Get uploaded file(s)
        const file = req.file as Express.Multer.File | undefined;
        const files = req.files as Express.Multer.File[] | undefined;

        if (!file && (!files || files.length === 0)) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        // Return file metadata
        if (file) {
          res.json({ 
            success: true, 
            file: getFileMetadata(file, config.subfolder) 
          });
        } else if (files) {
          res.json({ 
            success: true, 
            files: files.map(f => getFileMetadata(f, config.subfolder)) 
          });
        }
      });
    } catch (error: any) {
      console.error('Error setting up file upload:', error);
      res.status(500).json({ 
        error: 'Failed to upload file',
        message: error.message
      });
    }
  });

  // Get uploaded file (no authentication required - files are public)
  app.get("/api/form-files/:subfolder/:filename", async (req: any, res) => {
    try {
      const { subfolder, filename } = req.params;
      
      const filePath = getFormFile(subfolder, filename);
      if (!filePath) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Serve the file
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Error retrieving file:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve file',
        message: error.message
      });
    }
  });

  // Delete uploaded file (authenticated users only)
  app.delete("/api/form-files/:subfolder/:filename", authenticateToken, async (req: any, res) => {
    try {
      const { subfolder, filename } = req.params;
      
      const deleted = deleteFormFile(subfolder, filename);
      if (!deleted) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      res.status(500).json({ 
        error: 'Failed to delete file',
        message: error.message
      });
    }
  });
}
