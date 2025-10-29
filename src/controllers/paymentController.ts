import { Request, Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import PaymentConfig from '../models/PaymentConfig';
import Application from '../models/Application';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

// Crypto price API
const getCryptoPrice = async (currency: string): Promise<number> => {
  try {
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${currency}&vs_currencies=usd`);
    const currencyMap: { [key: string]: string } = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin'
    };
    return response.data[currencyMap[currency]]?.usd || 0;
  } catch (error) {
    throw new AppError('Failed to fetch crypto price', 500);
  }
};

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { applicationId, step, currency } = req.body;
    const userId = req.user!.id;

    // Get payment configuration
    const config = await PaymentConfig.findOne({ step, isActive: true });
    if (!config) {
      return next(new AppError('Payment configuration not found for this step', 404));
    }

    // Check if application exists and belongs to user
    const application = await Application.findOne({ _id: applicationId, userId });
    if (!application) {
      return next(new AppError('Application not found', 404));
    }

    // Check if payment already exists for this step
    const existingPayment = await Payment.findOne({ 
      applicationId, 
      step, 
      status: { $in: ['pending', 'confirmed'] } 
    });
    if (existingPayment) {
      return next(new AppError('Payment already exists for this step', 400));
    }

    // Calculate amount
    const usdAmount = config.amount;
    const cryptoPrice = await getCryptoPrice(currency);
    const cryptoAmount = usdAmount / cryptoPrice;

    // Create payment
    const payment = await Payment.create({
      userId,
      applicationId,
      step,
      amount: cryptoAmount,
      currency,
      cryptoAddress: config.cryptoWallet?.address || '',
      paymentMethod: currency.toLowerCase(),
      exchangeRate: cryptoPrice,
      usdAmount,
      walletAddress: config.cryptoWallet?.address || '',
      requiredConfirmations: currency === 'BTC' ? 3 : 12
    });

    res.status(201).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentId, transactionHash } = req.body;
    const userId = req.user!.id;

    const payment = await Payment.findOne({ _id: paymentId, userId });
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Update payment with transaction hash
    payment.transactionHash = transactionHash;
    payment.status = 'confirmed';
    payment.paidAt = new Date();
    payment.confirmations = payment.requiredConfirmations; // Simplified for demo
    await payment.save();

    // Update application payment status
    const application = await Application.findById(payment.applicationId);
    if (application) {
      application.paymentStatus[payment.step as keyof typeof application.paymentStatus] = 'paid';
      
      // Move to next step if payment is confirmed
      const stepOrder = ['application', 'assessment', 'interview', 'document_verification', 'visa_processing'];
      const currentIndex = stepOrder.indexOf(payment.step);
      if (currentIndex < stepOrder.length - 1) {
        application.currentStep = stepOrder[currentIndex + 1] as any;
      } else {
        application.currentStep = 'completed';
      }
      
      await application.save();
    }

    res.json({
      success: true,
      data: { payment, message: 'Payment verified successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { applicationId } = req.query;

    const query: any = { userId };
    if (applicationId) query.applicationId = applicationId;

    const payments = await Payment.find(query)
      .populate('applicationId', 'jobId currentStep')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const configs = await PaymentConfig.find({ isActive: true }).sort({ step: 1 });
    
    res.json({
      success: true,
      data: { configs }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePaymentConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { step } = req.params;
    const updateData = req.body;

    const config = await PaymentConfig.findOneAndUpdate(
      { step },
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: { config }
    });
  } catch (error) {
    next(error);
  }
};