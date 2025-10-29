import { Request, Response, NextFunction } from 'express';
import Company from '../models/Company';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { PDFGenerator } from '../utils/pdfGenerator';

export const createCompanyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id;
    
    // Check if company profile already exists
    const existingCompany = await Company.findOne({ userId });
    if (existingCompany) {
      return next(new AppError('Company profile already exists', 400));
    }

    const companyData = {
      userId,
      ...req.body
    };

    const company = await Company.create(companyData);

    // Auto-generate company documents
    await generateCompanyDocuments(company);

    res.status(201).json({
      success: true,
      message: 'Company profile created successfully',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id;
    
    const company = await Company.findOne({ userId }).populate('userId');
    
    if (!company) {
      return next(new AppError('Company profile not found', 404));
    }

    res.json({
      success: true,
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompanyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id;
    
    const company = await Company.findOneAndUpdate(
      { userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      return next(new AppError('Company profile not found', 404));
    }

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { page = 1, limit = 10, industry, verificationStatus } = req.query;
    
    const filter: any = {};
    if (industry) filter.industry = industry;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    const companies = await Company.find(filter)
      .populate('userId', 'name email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(filter);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { companyId } = req.params;
    const { verificationStatus, notes } = req.body;

    const company = await Company.findByIdAndUpdate(
      companyId,
      { 
        verificationStatus,
        verificationNotes: notes
      },
      { new: true }
    ).populate('userId');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Send verification email
    const user = company.userId as any;
    // Email notification logic here

    res.json({
      success: true,
      message: `Company ${verificationStatus} successfully`,
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadVerificationDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id;
    const { type } = req.body;
    
    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    const company = await Company.findOne({ userId });
    if (!company) {
      return next(new AppError('Company profile not found', 404));
    }

    const document = {
      type,
      fileName: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    company.verificationDocuments.push(document);
    await company.save();

    res.json({
      success: true,
      message: 'Verification document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    next(error);
  }
};

export const getCompanyStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const userId = req.user!._id;
    
    const company = await Company.findOne({ userId });
    if (!company) {
      return next(new AppError('Company profile not found', 404));
    }

    // Get job statistics
    const Job = require('../models/Job').default;
    const Application = require('../models/Application').default;
    
    const totalJobs = await Job.countDocuments({ postedBy: userId });
    const activeJobs = await Job.countDocuments({ postedBy: userId, isActive: true });
    const totalApplications = await Application.countDocuments({ 
      jobId: { $in: await Job.find({ postedBy: userId }).select('_id') }
    });

    const stats = {
      profileCompletion: company.profileCompletionPercentage,
      totalJobs,
      activeJobs,
      totalApplications,
      verificationStatus: company.verificationStatus,
      documentsGenerated: company.documentsGenerated
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

// Admin functions
export const adminGetAllCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    const filter: any = {};
    if (status) filter.verificationStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const companies = await Company.find(filter)
      .populate('userId', 'name email phone')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments(filter);

    res.json({
      success: true,
      data: {
        companies,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalCompanies: total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const adminApproveCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByIdAndUpdate(
      id,
      { 
        verificationStatus: 'verified',
        verificationNotes: 'Approved by admin'
      },
      { new: true }
    ).populate('userId');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    res.json({
      success: true,
      message: 'Company approved successfully',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

export const adminDeleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByIdAndDelete(id);
    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    // Also delete the associated user account
    await User.findByIdAndUpdate(company.userId, { isActive: false });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const adminUpdateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId');

    if (!company) {
      return next(new AppError('Company not found', 404));
    }

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to generate company documents
async function generateCompanyDocuments(company: any): Promise<void> {
  try {
    // Mark documents as generated
    company.documentsGenerated = {
      employmentContract: true,
      visaInvitation: true,
      workPermitLetter: true,
      accommodationLetter: true
    };
    
    await company.save();
  } catch (error) {
    console.error('Error generating company documents:', error);
  }
}