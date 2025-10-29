import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentConfig extends Document {
  step: 'assessment' | 'visa_processing' | 'document_processing';
  amount: number;
  currency: string;
  description: string;
  cryptoWallet?: {
    address: string;
    type: 'bitcoin' | 'ethereum' | 'usdt';
    qrCode?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentConfigSchema = new Schema<IPaymentConfig>({
  step: {
    type: String,
    enum: ['assessment', 'visa_processing', 'document_processing'],
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  description: {
    type: String,
    required: true
  },
  cryptoWallet: {
    address: {
      type: String,
      required: false
    },
    type: {
      type: String,
      enum: ['bitcoin', 'ethereum', 'usdt'],
      required: false
    },
    qrCode: {
      type: String,
      required: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPaymentConfig>('PaymentConfig', paymentConfigSchema);