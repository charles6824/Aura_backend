import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

interface Message {
  id: string;
  from: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  to: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  subject: string;
  content: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  attachments?: string[];
}

// Mock messages data - replace with actual database
const messages: Message[] = [
  {
    id: '1',
    from: {
      id: 'user1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'user'
    },
    to: {
      id: 'admin1',
      name: 'Admin',
      email: 'admin@aura.com',
      role: 'admin'
    },
    subject: 'Payment Issue - Assessment Fee',
    content: 'I made a payment for my assessment but it shows as pending. Can you please verify?',
    isRead: false,
    priority: 'high',
    createdAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    from: {
      id: 'company1',
      name: 'TechCorp HR',
      email: 'hr@techcorp.ca',
      role: 'company'
    },
    to: {
      id: 'admin1',
      name: 'Admin',
      email: 'admin@aura.com',
      role: 'admin'
    },
    subject: 'Job Posting Approval Request',
    content: 'We have submitted a new job posting for Software Engineer position. Please review and approve.',
    isRead: true,
    priority: 'medium',
    createdAt: new Date('2024-01-14T15:45:00Z')
  }
];

export const getMessages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;
    
    let filteredMessages = [...messages];
    
    if (status === 'unread') {
      filteredMessages = filteredMessages.filter(msg => !msg.isRead);
    } else if (status === 'read') {
      filteredMessages = filteredMessages.filter(msg => msg.isRead);
    }
    
    if (priority) {
      filteredMessages = filteredMessages.filter(msg => msg.priority === priority);
    }
    
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(filteredMessages.length / Number(limit)),
          totalMessages: filteredMessages.length,
          hasNext: endIndex < filteredMessages.length,
          hasPrev: startIndex > 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const message = messages.find(msg => msg.id === id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    messages[messageIndex].isRead = true;
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { to, subject, content, priority = 'medium' } = req.body;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      from: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role
      },
      to,
      subject,
      content,
      isRead: false,
      priority,
      createdAt: new Date()
    };
    
    messages.unshift(newMessage);
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: newMessage }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const messageIndex = messages.findIndex(msg => msg.id === id);
    
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    messages.splice(messageIndex, 1);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};