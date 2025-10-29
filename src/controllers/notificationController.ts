import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    // Mock notifications for now
    const notifications = [
      {
        _id: '1',
        title: 'Application Received',
        message: 'Your application for Software Engineer has been received',
        type: 'application',
        read: false,
        createdAt: new Date()
      }
    ];

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotifications: notifications.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};