import dotenv from 'dotenv';
dotenv.config();

import Database from '../config/database';
import PaymentConfig from '../models/PaymentConfig';
import logger from '../config/logger';

const paymentConfigs = [
  {
    step: 'application',
    baseAmount: 50,
    percentage: 100,
    description: 'Initial application processing fee',
    walletAddresses: {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      tether: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      usdc: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d'
    },
    minimumConfirmations: {
      bitcoin: 3,
      ethereum: 12,
      tether: 12,
      usdc: 12
    }
  },
  {
    step: 'assessment',
    baseAmount: 75,
    percentage: 100,
    description: 'Skills assessment and evaluation fee',
    walletAddresses: {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      tether: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      usdc: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d'
    },
    minimumConfirmations: {
      bitcoin: 3,
      ethereum: 12,
      tether: 12,
      usdc: 12
    }
  },
  {
    step: 'interview',
    baseAmount: 100,
    percentage: 100,
    description: 'Interview scheduling and coordination fee',
    walletAddresses: {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      tether: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      usdc: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d'
    },
    minimumConfirmations: {
      bitcoin: 3,
      ethereum: 12,
      tether: 12,
      usdc: 12
    }
  },
  {
    step: 'document_verification',
    baseAmount: 150,
    percentage: 100,
    description: 'Document verification and authentication fee',
    walletAddresses: {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      tether: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      usdc: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d'
    },
    minimumConfirmations: {
      bitcoin: 3,
      ethereum: 12,
      tether: 12,
      usdc: 12
    }
  },
  {
    step: 'visa_processing',
    baseAmount: 300,
    percentage: 100,
    description: 'Visa application processing and support fee',
    walletAddresses: {
      bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ethereum: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      tether: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      usdc: '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d'
    },
    minimumConfirmations: {
      bitcoin: 3,
      ethereum: 12,
      tether: 12,
      usdc: 12
    }
  }
];

const seedPaymentConfig = async () => {
  try {
    logger.info('🌱 Starting payment configuration seeding...');

    await Database.connectMongoDB();

    // Clear existing configs
    await PaymentConfig.deleteMany({});
    logger.info('🗑️  Cleared existing payment configurations');

    // Create new configs
    const createdConfigs = await PaymentConfig.create(paymentConfigs);
    logger.info(`✅ Created ${createdConfigs.length} payment configurations`);

    logger.info('🎉 Payment configuration seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Payment configuration seeding failed:', error);
    process.exit(1);
  }
};

seedPaymentConfig();