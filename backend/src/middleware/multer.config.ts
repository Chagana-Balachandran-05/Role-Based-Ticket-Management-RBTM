import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../utils/AppError';

const tempDir = path.join(process.cwd(), 'uploads', 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'];

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (!allowedMimeTypes.includes(mimeType) || !allowedExtensions.includes(ext)) {
    return cb(
      new AppError(
        `Invalid file type for ${file.originalname}. Only images, PDFs, and text files are allowed.`,
        400
      ),
      false
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5, // Max 5 files
  },
});

// Middleware to check total request payload size
export const checkTotalRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxTotalSize = 25 * 1024 * 1024; // 25MB
  if (contentLength > maxTotalSize) {
    return next(new AppError('Total payload size exceeds maximum limit of 25MB.', 400));
  }
  next();
};

// Custom wrapper middleware to handle multer errors gracefully
export const handleAttachmentUpload = (fieldName: string) => {
  const uploadMiddleware = upload.array(fieldName, 5);

  return (req: Request, res: Response, next: NextFunction) => {
    // Check total size first
    checkTotalRequestSize(req, res, (err) => {
      if (err) return next(err);

      uploadMiddleware(req, res, (uploadErr: any) => {
        if (uploadErr) {
          if (uploadErr instanceof multer.MulterError) {
            if (uploadErr.code === 'LIMIT_FILE_SIZE') {
              return next(new AppError('File too large. Maximum size is 5MB per file.', 400));
            }
            if (uploadErr.code === 'LIMIT_FILE_COUNT') {
              return next(new AppError('Too many files. Maximum is 5 files per request.', 400));
            }
            return next(new AppError(uploadErr.message, 400));
          }
          return next(uploadErr);
        }
        next();
      });
    });
  };
};
