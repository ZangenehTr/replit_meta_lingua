/**
 * Form File Upload Service
 * 
 * Unified file upload service for DynamicForm system.
 * Handles file uploads for various field types with validation and storage.
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Base upload directory
const BASE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'form-files');

// Ensure base directory exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) {
  fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });
}

/**
 * File type categories and their allowed MIME types
 */
export const FILE_TYPE_CATEGORIES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4'],
  archive: ['application/zip', 'application/x-zip-compressed', 'application/x-tar', 'application/gzip']
};

/**
 * Default file size limits by category (in bytes)
 */
export const DEFAULT_SIZE_LIMITS = {
  image: 5 * 1024 * 1024,      // 5MB
  document: 10 * 1024 * 1024,  // 10MB
  video: 500 * 1024 * 1024,    // 500MB
  audio: 50 * 1024 * 1024,     // 50MB
  archive: 100 * 1024 * 1024,  // 100MB
  default: 10 * 1024 * 1024    // 10MB
};

/**
 * Generate a unique filename with original extension
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '-')
    .substring(0, 50);
  
  return `${baseName}-${timestamp}-${randomString}${ext}`;
}

/**
 * Get MIME type category
 */
function getMimeCategory(mimeType: string): string {
  for (const [category, mimes] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (mimes.includes(mimeType)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Sanitize subfolder name to prevent path traversal attacks
 */
function sanitizeSubfolder(subfolder: string): string {
  // Remove any path separators and normalize
  const sanitized = subfolder
    .replace(/[\/\\]/g, '-')  // Replace path separators with dashes
    .replace(/\.\./g, '')     // Remove .. sequences
    .replace(/^\.+/, '')      // Remove leading dots
    .replace(/[^a-zA-Z0-9-_]/g, '-'); // Only allow alphanumeric, dashes, underscores

  // Default to 'general' if sanitization results in empty string
  return sanitized || 'general';
}

/**
 * Create multer storage configuration for form files
 */
export function createFormFileStorage(subfolder: string = 'general') {
  // Sanitize the subfolder to prevent path traversal
  const safeSubfolder = sanitizeSubfolder(subfolder);
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(BASE_UPLOAD_DIR, safeSubfolder);
      
      // Verify the resulting path is still within BASE_UPLOAD_DIR
      const resolvedPath = path.resolve(uploadPath);
      const resolvedBase = path.resolve(BASE_UPLOAD_DIR);
      
      if (!resolvedPath.startsWith(resolvedBase)) {
        return cb(new Error('Invalid upload path detected'), '');
      }
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, generateUniqueFilename(file.originalname));
    }
  });
}

/**
 * File filter to validate file types
 */
export function createFileFilter(allowedTypes?: string[]) {
  return function (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    // If no restrictions, allow all files
    if (!allowedTypes || allowedTypes.length === 0) {
      return cb(null, true);
    }

    // Check if file type is allowed
    const isAllowed = allowedTypes.some(allowed => {
      // Handle wildcards like "image/*"
      if (allowed.includes('*')) {
        const category = allowed.split('/')[0];
        return file.mimetype.startsWith(category + '/');
      }
      
      // Handle extensions like ".pdf"
      if (allowed.startsWith('.')) {
        return file.originalname.toLowerCase().endsWith(allowed.toLowerCase());
      }
      
      // Handle exact MIME types
      return file.mimetype === allowed;
    });

    if (!isAllowed) {
      return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`));
    }

    cb(null, true);
  };
}

/**
 * Create configured multer instance for form file uploads
 */
export function createFormFileUploader(options: {
  subfolder?: string;
  allowedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
}) {
  const {
    subfolder = 'general',
    allowedTypes,
    maxSize,
    multiple = false,
    maxFiles = 10
  } = options;

  // Determine size limit based on file types
  let sizeLimit = maxSize;
  if (!sizeLimit && allowedTypes && allowedTypes.length > 0) {
    // Use the first allowed type to determine default limit
    const firstType = allowedTypes[0];
    if (firstType.includes('image')) sizeLimit = DEFAULT_SIZE_LIMITS.image;
    else if (firstType.includes('video')) sizeLimit = DEFAULT_SIZE_LIMITS.video;
    else if (firstType.includes('audio')) sizeLimit = DEFAULT_SIZE_LIMITS.audio;
    else if (firstType.includes('pdf') || firstType.includes('document')) sizeLimit = DEFAULT_SIZE_LIMITS.document;
    else sizeLimit = DEFAULT_SIZE_LIMITS.default;
  }
  if (!sizeLimit) sizeLimit = DEFAULT_SIZE_LIMITS.default;

  const uploader = multer({
    storage: createFormFileStorage(subfolder),
    limits: {
      fileSize: sizeLimit,
      files: multiple ? maxFiles : 1
    },
    fileFilter: createFileFilter(allowedTypes)
  });

  return multiple ? uploader.array('files', maxFiles) : uploader.single('file');
}

/**
 * Get file metadata
 */
export interface FileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  path: string;
  url: string;
}

export function getFileMetadata(file: Express.Multer.File, subfolder: string = 'general'): FileMetadata {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    category: getMimeCategory(file.mimetype),
    path: file.path,
    url: `/api/form-files/${subfolder}/${file.filename}`
  };
}

/**
 * Delete a file from storage
 */
export function deleteFormFile(subfolder: string, filename: string): boolean {
  try {
    // Sanitize inputs to prevent path traversal
    const safeSubfolder = sanitizeSubfolder(subfolder);
    const safeFilename = path.basename(filename); // Only get the filename, no path components
    
    const filePath = path.join(BASE_UPLOAD_DIR, safeSubfolder, safeFilename);
    
    // Verify the resulting path is still within BASE_UPLOAD_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(BASE_UPLOAD_DIR);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      console.error('Path traversal attempt detected in deleteFormFile');
      return false;
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file from storage
 */
export function getFormFile(subfolder: string, filename: string): string | null {
  // Sanitize inputs to prevent path traversal
  const safeSubfolder = sanitizeSubfolder(subfolder);
  const safeFilename = path.basename(filename); // Only get the filename, no path components
  
  const filePath = path.join(BASE_UPLOAD_DIR, safeSubfolder, safeFilename);
  
  // Verify the resulting path is still within BASE_UPLOAD_DIR
  const resolvedPath = path.resolve(filePath);
  const resolvedBase = path.resolve(BASE_UPLOAD_DIR);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    console.error('Path traversal attempt detected in getFormFile');
    return null;
  }
  
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
