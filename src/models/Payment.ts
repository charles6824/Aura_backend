import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  step: 'application' | 'assessment' | 'interview' | 'document_verification' | 'visa_processing';
  amount: number;
  currency: 'BTC' | 'ETH' | 'USDT' | 'USDC';
  cryptoAddress: string;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  paymentMethod: 'bitcoin' | 'ethereum' | 'tether' | 'usdc';
  exchangeRate: number;
  usdAmount: number;
  walletAddress: string;
  confirmations: number;
  requiredConfirmations: number;
  expiresAt: Date;
  paidAt?: Date;
  metadata: {
    blockNumber?: number;
    gasUsed?: number;
    gasPrice?: number;
  };
}

const paymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  step: {
    type: String,
    enum: ['application', 'assessment', 'interview', 'document_verification', 'visa_processing'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BTC', 'ETH', 'USDT', 'USDC'],
    required: true
  },
  cryptoAddress: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed', 'expired'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['bitcoin', 'ethereum', 'tether', 'usdc'],
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  usdAmount: {
    type: Number,
    required: true
  },
  walletAddress: {
    type: String,
    required: true
  },
  confirmations: {
    type: Number,
    default: 0
  },
  requiredConfirmations: {
    type: Number,
    default: 3
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  paidAt: {
    type: Date
  },
  metadata: {
    blockNumber: Number,
    gasUsed: Number,
    gasPrice: Number
  }
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1, applicationId: 1, step: 1 });
paymentSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });
paymentSchema.index({ expiresAt: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);