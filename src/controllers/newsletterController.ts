import { Request, Response, NextFunction } from 'express';
import Newsletter from '../models/Newsletter';
import { AppError } from '../utils/AppError';
import emailService from '../utils/email';

export const subscribeNewsletter = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.isActive) {
        return res.json({
          success: true,
          message: 'You are already subscribed to our newsletter!'
        });
      } else {
        // Reactivate subscription
        existing.isActive = true;
        existing.subscribedAt = new Date();
        await existing.save();
      }
    } else {
      // Create new subscription
      await Newsletter.create({ email });
    }

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(email, 'Subscriber', '');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribeNewsletter = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { email } = req.body;

    const subscription = await Newsletter.findOne({ email });
    if (!subscription) {
      return next(new AppError('Email not found in our newsletter list', 404));
    }

    subscription.isActive = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    next(error);
  }
};