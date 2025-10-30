/**
 * Form Submission Handler Middleware
 * 
 * Handles multipart form submissions with mixed text and file data for DynamicForm
 */

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { createFormFileUploader, getFileMetadata } from '../services/form-file-service.js';

/**
 * Process form submission with mixed text and file data
 * 
 * This middleware:
 * 1. Accepts multipart form data
 * 2. Separates text fields from file fields
 * 3. Uploads files to storage
 * 4. Attaches processed data to req.body.processedData
 */
export async function processFormSubmission(
  formDefinition: any
): Promise<(req: Request, res: Response, next: NextFunction) => void> {
  
  // Extract file fields from form definition
  const fileFields = formDefinition.fields
    .filter((field: any) => ['file', 'audio'].includes(field.type))
    .map((field: any) => ({
      name: field.id,
      maxCount: field.fileConfig?.multiple ? (field.fileConfig?.maxFiles || 10) : 1
    }));

  // If no file fields, just parse JSON and continue
  if (fileFields.length === 0) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Regular JSON body - data should already be parsed
      next();
    };
  }

  // Create multer upload handler for all file fields
  const upload = multer({
    storage: multer.memoryStorage(), // Store in memory temporarily
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB max per file
    }
  }).fields(fileFields);

  // Return middleware function
  return (req: any, res: Response, next: NextFunction) => {
    upload(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({
          error: 'File upload failed',
          message: err.message
        });
      }

      try {
        // Extract text fields from req.body
        const textData: Record<string, any> = {};
        const fileData: Record<string, any> = {};

        // Process text fields
        for (const key in req.body) {
          if (key !== 'data') {
            textData[key] = req.body[key];
          }
        }

        // If data is sent as JSON string, parse it
        if (req.body.data && typeof req.body.data === 'string') {
          try {
            const parsedData = JSON.parse(req.body.data);
            Object.assign(textData, parsedData);
          } catch {
            // If parsing fails, use as-is
            Object.assign(textData, req.body);
          }
        } else if (req.body.data && typeof req.body.data === 'object') {
          Object.assign(textData, req.body.data);
        }

        // Process uploaded files
        if (req.files) {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] };
          
          for (const fieldName in files) {
            const fieldFiles = files[fieldName];
            const field = formDefinition.fields.find((f: any) => f.id === fieldName);
            
            if (!field) continue;

            const subfolder = field.fileConfig?.uploadPath || field.id;
            
            // Upload each file
            const uploadedFiles = [];
            for (const file of fieldFiles) {
              const metadata = getFileMetadata(file, subfolder);
              uploadedFiles.push({
                filename: metadata.filename,
                originalName: metadata.originalName,
                mimeType: metadata.mimeType,
                size: metadata.size,
                url: metadata.url,
                path: metadata.path
              });
            }

            // Store file metadata in form data
            if (field.fileConfig?.multiple) {
              fileData[fieldName] = uploadedFiles;
            } else {
              fileData[fieldName] = uploadedFiles[0] || null;
            }
          }
        }

        // Merge text data and file data
        const processedData = {
          ...textData,
          ...fileData
        };

        // Attach processed data to request
        req.processedFormData = processedData;

        next();
      } catch (error: any) {
        console.error('Error processing form submission:', error);
        res.status(500).json({
          error: 'Failed to process form submission',
          message: error.message
        });
      }
    });
  };
}

/**
 * Helper function to check if a form has file fields
 */
export function hasFileFields(formDefinition: any): boolean {
  return formDefinition.fields.some((field: any) => 
    ['file', 'audio'].includes(field.type)
  );
}

/**
 * Simple middleware to extract form data from request
 * Works for both JSON and multipart requests
 */
export function extractFormData(req: any, res: Response, next: NextFunction) {
  // If processedFormData exists (from multipart), use it
  if (req.processedFormData) {
    req.formData = req.processedFormData;
    return next();
  }

  // Otherwise, extract from req.body
  if (req.body.data) {
    req.formData = typeof req.body.data === 'string' 
      ? JSON.parse(req.body.data) 
      : req.body.data;
  } else {
    req.formData = req.body;
  }

  next();
}
