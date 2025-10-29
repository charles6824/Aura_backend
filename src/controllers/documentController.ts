import { Request, Response, NextFunction } from 'express';
import Document from '../models/Document';
import Application from '../models/Application';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

// Document templates
const generateVisaApplication = async (userId: string, applicationData: any): Promise<string> => {
  const doc = new PDFDocument();
  const fileName = `visa_application_${userId}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../uploads/generated', fileName);
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  
  doc.pipe(fs.createWriteStream(filePath));
  
  doc.fontSize(20).text('VISA APPLICATION FORM', 100, 100);
  doc.fontSize(12).text(`Applicant Name: ${applicationData.userName}`, 100, 150);
  doc.text(`Job Title: ${applicationData.jobTitle}`, 100, 170);
  doc.text(`Company: ${applicationData.company}`, 100, 190);
  doc.text(`Application Date: ${new Date().toLocaleDateString()}`, 100, 210);
  
  doc.end();
  
  return `/uploads/generated/${fileName}`;
};

const generateEmploymentContract = async (userId: string, applicationData: any): Promise<string> => {
  const doc = new PDFDocument();
  const fileName = `employment_contract_${userId}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../uploads/generated', fileName);
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  doc.pipe(fs.createWriteStream(filePath));
  
  doc.fontSize(20).text('EMPLOYMENT CONTRACT', 100, 100);
  doc.fontSize(12).text(`Employee: ${applicationData.userName}`, 100, 150);
  doc.text(`Position: ${applicationData.jobTitle}`, 100, 170);
  doc.text(`Employer: ${applicationData.company}`, 100, 190);
  doc.text(`Salary: ${applicationData.salary}`, 100, 210);
  doc.text(`Start Date: ${applicationData.startDate}`, 100, 230);
  
  doc.end();
  
  return `/uploads/generated/${fileName}`;
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId, type } = req.body;
    const userId = req.user!.id;
    
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const application = await Application.findOne({ _id: applicationId, userId });
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    const document = await Document.create({
      userId,
      applicationId,
      type,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      metadata: {
        extractedText: '', // Would implement OCR here
        ocrConfidence: 0
      }
    });

    res.status(201).json({
      success: true,
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId } = req.params;
    const { status, verificationNotes } = req.body;
    const verifierId = req.user!.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    document.status = status;
    document.verificationNotes = verificationNotes;
    document.verifiedBy = verifierId;
    document.verifiedAt = new Date();
    await document.save();

    // Check if all required documents are verified
    if (status === 'verified') {
      const allDocuments = await Document.find({ 
        applicationId: document.applicationId,
        type: { $in: ['passport', 'degree', 'transcript'] } // Required documents
      });
      
      const allVerified = allDocuments.every(doc => doc.status === 'verified');
      
      if (allVerified) {
        await Application.findByIdAndUpdate(document.applicationId, {
          documentsVerified: true
        });
      }
    }

    res.json({
      success: true,
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

export const generateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId, documentType } = req.params;
    const userId = req.user!.id;

    const document = await Document.findOne({ _id: documentId, userId })
      .populate({
        path: 'applicationId',
        populate: {
          path: 'jobId userId',
          select: 'title company salary name email'
        }
      });

    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    if (document.status !== 'verified') {
      return next(new AppError('Document must be verified before generating related documents', 400));
    }

    const application = document.applicationId as any;
    const applicationData = {
      userName: application.userId.name,
      userEmail: application.userId.email,
      jobTitle: application.jobId.title,
      company: application.jobId.company,
      salary: application.jobId.salary,
      startDate: application.offerDetails?.startDate || new Date()
    };

    let generatedFilePath: string;

    switch (documentType) {
      case 'visa_application':
        generatedFilePath = await generateVisaApplication(userId, applicationData);
        break;
      case 'employment_contract':
        generatedFilePath = await generateEmploymentContract(userId, applicationData);
        break;
      default:
        return next(new AppError('Invalid document type', 400));
    }

    // Add generated document to the original document
    document.generatedDocuments = document.generatedDocuments || [];
    document.generatedDocuments.push({
      type: documentType as any,
      fileName: path.basename(generatedFilePath),
      fileUrl: generatedFilePath,
      generatedAt: new Date()
    });

    await document.save();

    res.json({
      success: true,
      data: { 
        document,
        generatedDocument: {
          type: documentType,
          fileUrl: generatedFilePath
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { applicationId, type, status } = req.query;

    const query: any = { userId };
    if (applicationId) query.applicationId = applicationId;
    if (type) query.type = type;
    if (status) query.status = status;

    const documents = await Document.find(query)
      .populate('applicationId', 'jobId currentStep')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { documents }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { documentId, generatedType } = req.params;
    const userId = req.user!.id;

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) {
      return next(new AppError('Document not found', 404));
    }

    let filePath: string;

    if (generatedType) {
      const generatedDoc = document.generatedDocuments?.find(doc => doc.type === generatedType);
      if (!generatedDoc) {
        return next(new AppError('Generated document not found', 404));
      }
      filePath = path.join(__dirname, '../..', generatedDoc.fileUrl);
    } else {
      filePath = path.join(__dirname, '../..', document.fileUrl);
    }

    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found on server', 404));
    }

    res.download(filePath);
  } catch (error) {
    next(error);
  }
};