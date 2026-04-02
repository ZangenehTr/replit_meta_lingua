import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/audio/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(performance.now());
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const videoDir = path.join(process.cwd(), 'uploads', 'videos', 'raw');
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    cb(null, videoDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /mp4|webm|ogg|mov|avi|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const photoDir = path.join(process.cwd(), 'uploads', 'teacher-photos');
    if (!fs.existsSync(photoDir)) {
      fs.mkdirSync(photoDir, { recursive: true });
    }
    cb(null, photoDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.params.teacherId}.jpg`);
  }
});

export const uploadPhoto = multer({ 
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const studentPhotoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const photoDir = path.join(process.cwd(), 'uploads', 'student-photos');
    if (!fs.existsSync(photoDir)) {
      fs.mkdirSync(photoDir, { recursive: true });
    }
    cb(null, photoDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    cb(null, `student-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

export const uploadStudentPhoto = multer({ 
  storage: studentPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export const audioUpload = multer({ 
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'));
    }
  }
});
