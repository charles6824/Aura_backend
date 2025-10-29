import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';

interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  isEditable: boolean;
  lastModified: Date;
}

// Mock settings data - replace with actual database
const settings: SystemSettings[] = [
  {
    id: '1',
    category: 'payment',
    key: 'assessment_fee',
    value: 150,
    description: 'Assessment fee in USD',
    type: 'number',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '2',
    category: 'payment',
    key: 'document_processing_fee',
    value: 200,
    description: 'Document processing fee in USD',
    type: 'number',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '3',
    category: 'payment',
    key: 'visa_processing_fee',
    value: 500,
    description: 'Visa processing fee in USD',
    type: 'number',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '4',
    category: 'payment',
    key: 'crypto_wallets',
    value: {
      BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      ETH: '0x742d35Cc6634C0532925a3b8D404fddF4f780EAD',
      USDT: '0x8ba1f109551bD432803012645Hac136c30C6756',
      USDC: '0x9ba1f109551bD432803012645Hac136c30C6757'
    },
    description: 'Cryptocurrency wallet addresses',
    type: 'object',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '5',
    category: 'system',
    key: 'maintenance_mode',
    value: false,
    description: 'Enable maintenance mode',
    type: 'boolean',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '6',
    category: 'system',
    key: 'max_file_size',
    value: 10485760,
    description: 'Maximum file upload size in bytes (10MB)',
    type: 'number',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '7',
    category: 'email',
    key: 'smtp_host',
    value: 'smtp.gmail.com',
    description: 'SMTP server host',
    type: 'string',
    isEditable: true,
    lastModified: new Date()
  },
  {
    id: '8',
    category: 'email',
    key: 'smtp_port',
    value: 587,
    description: 'SMTP server port',
    type: 'number',
    isEditable: true,
    lastModified: new Date()
  }
];

export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { category } = req.query;
    
    let filteredSettings = settings;
    if (category) {
      filteredSettings = settings.filter(setting => setting.category === category);
    }
    
    const groupedSettings = filteredSettings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {} as Record<string, SystemSettings[]>);
    
    res.json({
      success: true,
      data: { settings: groupedSettings }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    const settingIndex = settings.findIndex(setting => setting.id === id);
    if (settingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }
    
    const setting = settings[settingIndex];
    if (!setting.isEditable) {
      return res.status(403).json({
        success: false,
        message: 'This setting is not editable'
      });
    }
    
    // Validate value type
    if (setting.type === 'number' && typeof value !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Value must be a number'
      });
    }
    
    if (setting.type === 'boolean' && typeof value !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Value must be a boolean'
      });
    }
    
    settings[settingIndex] = {
      ...setting,
      value,
      lastModified: new Date()
    };
    
    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: { setting: settings[settingIndex] }
    });
  } catch (error) {
    next(error);
  }
};

export const resetSettings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const { category } = req.body;
    
    // Reset specific category or all settings
    const settingsToReset = category 
      ? settings.filter(setting => setting.category === category)
      : settings;
    
    // In a real implementation, you would reset to default values from database
    res.json({
      success: true,
      message: `Settings ${category ? `for ${category}` : ''} reset to defaults`
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemInfo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const systemInfo = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      lastRestart: new Date(Date.now() - process.uptime() * 1000)
    };
    
    res.json({
      success: true,
      data: { systemInfo }
    });
  } catch (error) {
    next(error);
  }
};