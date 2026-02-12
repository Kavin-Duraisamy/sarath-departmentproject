import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload file to Cloudinary
const uploadToCloudinary = (buffer: Buffer, folder: string, resourceType: 'image' | 'raw' = 'image'): Promise<any> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `department-portal/${folder}`,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

// Upload resume
export const uploadResume = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const result = await uploadToCloudinary(req.file.buffer, 'resumes', 'raw');

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
};

// Upload certificate
export const uploadCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const result = await uploadToCloudinary(req.file.buffer, 'certificates', 'raw');

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Upload certificate error:', error);
        res.status(500).json({ error: 'Failed to upload certificate' });
    }
};

// Upload profile photo
export const uploadProfilePhoto = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const result = await uploadToCloudinary(req.file.buffer, 'profiles', 'image');

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Upload profile photo error:', error);
        res.status(500).json({ error: 'Failed to upload profile photo' });
    }
};

// Upload generic document
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const { folder = 'documents' } = req.body;
        const result = await uploadToCloudinary(req.file.buffer, folder, 'raw');

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Upload document error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};
