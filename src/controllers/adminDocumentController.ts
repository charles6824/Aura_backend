import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads');
    const documents = [];

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        documents.push({
          id: file,
          name: file,
          size: stats.size,
          type: path.extname(file),
          uploadedAt: stats.birthtime,
          downloadUrl: `/uploads/${file}`
        });
      }
    }

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getDocumentTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const templates = [
      {
        id: '1',
        name: 'Employment Contract Template',
        type: 'contract',
        language: 'en',
        lastModified: new Date(),
        isActive: true
      },
      {
        id: '2',
        name: 'Visa Invitation Letter Template',
        type: 'visa',
        language: 'en',
        lastModified: new Date(),
        isActive: true
      },
      {
        id: '3',
        name: 'Assessment Certificate Template',
        type: 'certificate',
        language: 'en',
        lastModified: new Date(),
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    next(error);
  }
};