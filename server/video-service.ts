import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import crypto from 'crypto';

// Video upload configuration
const videoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const tempDir = path.join(process.cwd(), 'uploads', 'temp');
    // Ensure directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter for video types
const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /mp4|webm|avi|mov|mkv|m4v/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (mp4, webm, avi, mov, mkv, m4v)'));
  }
};

// Multer upload instance
export const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: videoFileFilter
});

// Move video from temp to permanent location
export async function moveVideoToPermanent(tempPath: string, lessonId: number): Promise<string> {
  const lessonDir = path.join(process.cwd(), 'uploads', 'videos', 'lessons', lessonId.toString());
  
  // Create lesson directory if it doesn't exist
  if (!fs.existsSync(lessonDir)) {
    fs.mkdirSync(lessonDir, { recursive: true });
  }

  const filename = 'video.mp4'; // Standardize filename
  const permanentPath = path.join(lessonDir, filename);

  // Move file from temp to permanent location
  await fs.promises.rename(tempPath, permanentPath);
  
  // Return relative path for database storage
  return `/uploads/videos/lessons/${lessonId}/${filename}`;
}

// Generate video thumbnail (placeholder - requires ffmpeg in production)
export async function generateThumbnail(videoPath: string, lessonId: number): Promise<string> {
  const lessonDir = path.join(process.cwd(), 'uploads', 'videos', 'lessons', lessonId.toString());
  const thumbnailPath = path.join(lessonDir, 'thumbnail.jpg');
  
  // In production, use ffmpeg to generate thumbnail
  // For now, create a placeholder
  const placeholderThumbnail = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  await fs.promises.writeFile(thumbnailPath, placeholderThumbnail);
  
  return `/uploads/videos/lessons/${lessonId}/thumbnail.jpg`;
}

// Stream video with range request support
export function streamVideo(req: Request, res: Response, videoPath: string) {
  try {
    const fullPath = path.join(process.cwd(), videoPath.startsWith('/') ? videoPath.slice(1) : videoPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const stat = fs.statSync(fullPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(fullPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range request, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(fullPath).pipe(res);
    }
  } catch (error) {
    console.error('Video streaming error:', error);
    res.status(500).json({ message: 'Error streaming video' });
  }
}

// Get video metadata
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number;
  size: number;
  format: string;
}> {
  const fullPath = path.join(process.cwd(), videoPath.startsWith('/') ? videoPath.slice(1) : videoPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error('Video file not found');
  }

  const stat = await fs.promises.stat(fullPath);
  const ext = path.extname(fullPath).toLowerCase().slice(1);
  
  // In production, use ffprobe to get actual duration
  // For now, estimate based on file size (rough estimate)
  const estimatedDuration = Math.floor(stat.size / (1024 * 1024) * 8); // Very rough estimate
  
  return {
    duration: estimatedDuration,
    size: stat.size,
    format: ext
  };
}

// Clean up old temp files (run periodically)
export async function cleanupTempFiles() {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  
  if (!fs.existsSync(tempDir)) {
    return;
  }

  const files = await fs.promises.readdir(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stat = await fs.promises.stat(filePath);
    
    if (now - stat.mtimeMs > maxAge) {
      await fs.promises.unlink(filePath);
      console.log(`Cleaned up old temp file: ${file}`);
    }
  }
}

// Validate video file
export async function validateVideoFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(filePath);
    
    // Check file size
    if (stat.size === 0) {
      return false;
    }
    
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const validExtensions = ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.m4v'];
    
    if (!validExtensions.includes(ext)) {
      return false;
    }
    
    // In production, use ffprobe to validate video format
    return true;
  } catch (error) {
    console.error('Video validation error:', error);
    return false;
  }
}