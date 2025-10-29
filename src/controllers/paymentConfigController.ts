import { Request, Response, NextFunction } from 'express';
import PaymentConfig from '../models/PaymentConfig';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

export const createPaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { step, amount, currency, description, cryptoWallet } = req.body;

    // Check if config already exists for this step
    const existingConfig = await PaymentConfig.findOne({ step });
    if (existingConfig) {
      return next(new AppError(`Payment configuration already exists for ${step}`, 400));
    }

    const config = await PaymentConfig.create({
      step,
      amount,
      currency,
      description,
      cryptoWallet
    });

    res.status(201).json({
      success: true,
      message: 'Payment configuration created successfully',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPaymentConfigs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const configs = await PaymentConfig.find().sort({ step: 1 });

    res.json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { step } = req.params;
    
    const config = await PaymentConfig.findOne({ step, isActive: true });
    
    if (!config) {
      return next(new AppError('Payment configuration not found', 404));
    }

    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { step } = req.params;
    const updateData = req.body;

    const config = await PaymentConfig.findOneAndUpdate(
      { step },
      updateData,
      { new: true, runValidators: true }
    );

    if (!config) {
      return next(new AppError('Payment configuration not found', 404));
    }

    res.json({
      success: true,
      message: 'Payment configuration updated successfully',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCryptoWallet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { step } = req.params;
    const { address, type, qrCode } = req.body;

    const config = await PaymentConfig.findOneAndUpdate(
      { step },
      { 
        'cryptoWallet.address': address,
        'cryptoWallet.type': type,
        'cryptoWallet.qrCode': qrCode
      },
      { new: true, runValidators: true }
    );

    if (!config) {
      return next(new AppError('Payment configuration not found', 404));
    }

    res.json({
      success: true,
      message: 'Crypto wallet updated successfully',
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const togglePaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { step } = req.params;
    const { isActive } = req.body;

    const config = await PaymentConfig.findOneAndUpdate(
      { step },
      { isActive },
      { new: true }
    );

    if (!config) {
      return next(new AppError('Payment configuration not found', 404));
    }

    res.json({
      success: true,
      message: `Payment configuration ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const Payment = require('../models/Payment').default;
    
    // Get payment statistics
    const totalPayments = await Payment.countDocuments({ status: 'confirmed' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$usdAmount' } } }
    ]);

    const paymentsByStep = await Payment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: '$step', count: { $sum: 1 }, revenue: { $sum: '$usdAmount' } } }
    ]);

    const recentPayments = await Payment.find({ status: 'confirmed' })
      .populate('userId', 'name email')
      .sort({ paidAt: -1 })
      .limit(10);

    const stats = {
      totalPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      paymentsByStep,
      recentPayments
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
};

export const seedDefaultConfigs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const defaultConfigs = [
      {
        step: 'assessment',
        amount: 50,
        currency: 'USD',
        description: 'Assessment fee for job application evaluation',
        cryptoWallet: {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          type: 'bitcoin'
        }
      },
      {
        step: 'document_processing',
        amount: 200,
        currency: 'USD',
        description: 'Document processing and verification fee',
        cryptoWallet: {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
          type: 'ethereum'
        }
      },
      {
        step: 'visa_processing',
        amount: 500,
        currency: 'USD',
        description: 'Visa processing and relocation assistance fee',
        cryptoWallet: {
          address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oREqjK',
          type: 'usdt'
        }
      }
    ];

    for (const configData of defaultConfigs) {
      const existingConfig = await PaymentConfig.findOne({ step: configData.step });
      if (!existingConfig) {
        await PaymentConfig.create(configData);
      }
    }

    res.json({
      success: true,
      message: 'Default payment configurations seeded successfully'
    });
  } catch (error) {
    next(error);
  }
};