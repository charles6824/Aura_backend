import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Application from '../models/Application';
import Job from '../models/Job';
import { AuthRequest } from '../middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      activeJobs,
      pendingApplications,
      recentUsers,
      recentCompanies,
      monthlyStats
    ] = await Promise.all([
      User.countDocuments({ role: 'user', isActive: true }),
      Company.countDocuments({ isActive: true }),
      Job.countDocuments(),
      Application.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments({ status: 'pending' }),
      User.find({ role: 'user', isActive: true }).sort({ createdAt: -1 }).limit(10).select('name email createdAt'),
      Company.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('name location createdAt'),
      getMonthlyStats()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCompanies,
          totalJobs,
          totalApplications,
          activeJobs,
          pendingApplications
        },
        recent: {
          users: recentUsers,
          companies: recentCompanies
        },
        monthlyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyStats = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1 as 1, '_id.month': 1 as 1 }
    }
  ];

  const [userStats, companyStats, applicationStats] = await Promise.all([
    User.aggregate(pipeline),
    Company.aggregate(pipeline),
    Application.aggregate(pipeline)
  ]);

  return {
    users: userStats,
    companies: companyStats,
    applications: applicationStats
  };
};

export const getPaymentAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Mock payment analytics - replace with actual payment data
    const paymentStats = {
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      totalTransactions: 450,
      pendingPayments: 12,
      failedPayments: 8,
      topCurrencies: [
        { currency: 'USDT', amount: 75000, percentage: 60 },
        { currency: 'BTC', amount: 25000, percentage: 20 },
        { currency: 'ETH', amount: 20000, percentage: 16 },
        { currency: 'USDC', amount: 5000, percentage: 4 }
      ]
    };

    res.json({
      success: true,
      data: paymentStats
    });
  } catch (error) {
    next(error);
  }
};