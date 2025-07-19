import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { Request } from 'express';

// Create uploads directory structure
const createUploadsDirectory = () => {
  const baseDir = path.join(process.cwd(), 'uploads');
  const profilesDir = path.join(baseDir, 'profiles');
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  
  if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
  }
  
  return { baseDir, profilesDir };
};

// Initialize directories
const { baseDir, profilesDir } = createUploadsDirectory();

// Multer configuration for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // Create organization-specific directory
    const organizationId = (req.user as any)?.organizationId || 'default';
    const orgDir = path.join(profilesDir, organizationId);
    
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }
    
    cb(null, orgDir);
  },
  filename: (req: Request, file, cb) => {
    const userId = (req.user as any)?.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Generate unique filename: userId_timestamp.ext
    cb(null, `${userId}_${timestamp}${ext}`);
  }
});

// File filter for images only
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer instance for profile image uploads
export const profileImageUpload = multer({
  storage: profileImageStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Image processing function
export const processProfileImage = async (filePath: string): Promise<string> => {
  try {
    const processedFileName = filePath.replace(/\.[^/.]+$/, '_processed.jpg');
    
    await sharp(filePath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(processedFileName);
    
    // Delete original file
    fs.unlinkSync(filePath);
    
    return processedFileName;
  } catch (error) {
    console.error('Error processing profile image:', error);
    throw new Error('Failed to process profile image');
  }
};

// Generate public URL for image
export const generateImageUrl = (filePath: string): string => {
  const relativePath = path.relative(process.cwd(), filePath);
  return `/${relativePath.replace(/\\/g, '/')}`;
};

// Clean up old profile images for a user
export const cleanupOldProfileImages = async (userId: string, organizationId: string, keepFile?: string) => {
  try {
    const orgDir = path.join(profilesDir, organizationId);
    
    if (!fs.existsSync(orgDir)) return;
    
    const files = fs.readdirSync(orgDir);
    const userFiles = files.filter(file => file.startsWith(`${userId}_`));
    
    for (const file of userFiles) {
      const filePath = path.join(orgDir, file);
      
      // Don't delete the file we want to keep
      if (keepFile && filePath === keepFile) continue;
      
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error(`Failed to delete old profile image: ${filePath}`, error);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old profile images:', error);
  }
};

// Delete specific profile image
export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    if (!imageUrl) return;
    
    // Convert URL back to file path
    const filePath = path.join(process.cwd(), imageUrl.replace(/^\//, ''));
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting profile image:', error);
  }
};

// Get organization storage statistics
export const getOrganizationStorageStats = (organizationId: string) => {
  try {
    const orgDir = path.join(profilesDir, organizationId);
    
    if (!fs.existsSync(orgDir)) {
      return { totalFiles: 0, totalSize: 0 };
    }
    
    const files = fs.readdirSync(orgDir);
    let totalSize = 0;
    
    files.forEach(file => {
      const filePath = path.join(orgDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    
    return {
      totalFiles: files.length,
      totalSize: totalSize,
      totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalFiles: 0, totalSize: 0, totalSizeMB: 0 };
  }
};