import { IPayment } from '../models/Payment';
import { IPaymentConfig } from '../models/PaymentConfig';
import Payment from '../models/Payment';
import PaymentConfig from '../models/PaymentConfig';

export interface PaymentRequest {
  userId: string;
  applicationId: string;
  step: 'assessment' | 'document_processing' | 'visa_processing';
  currency: 'BTC' | 'ETH' | 'USDT' | 'USDC';
}

export interface PaymentResponse {
  paymentId: string;
  amount: number;
  currency: string;
  walletAddress: string;
  qrCode?: string;
  expiresAt: Date;
  exchangeRate: number;
  usdAmount: number;
}

export class PaymentGateway {
  private static readonly EXCHANGE_RATES = {
    BTC: 45000,
    ETH: 2500,
    USDT: 1,
    USDC: 1
  };

  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Get payment configuration for the step
    const config = await PaymentConfig.findOne({ 
      step: request.step === 'assessment' ? 'assessment' : 
            request.step === 'document_processing' ? 'document_processing' : 
            'visa_processing',
      isActive: true 
    });

    if (!config) {
      throw new Error(`Payment configuration not found for step: ${request.step}`);
    }

    if (!config.cryptoWallet?.address) {
      throw new Error('Crypto wallet not configured for this payment step');
    }

    const exchangeRate = this.EXCHANGE_RATES[request.currency];
    const cryptoAmount = config.amount / exchangeRate;

    // Create payment record
    const payment = new Payment({
      userId: request.userId,
      applicationId: request.applicationId,
      step: request.step,
      amount: cryptoAmount,
      currency: request.currency,
      cryptoAddress: config.cryptoWallet.address,
      paymentMethod: request.currency.toLowerCase(),
      exchangeRate,
      usdAmount: config.amount,
      walletAddress: config.cryptoWallet.address,
      requiredConfirmations: request.currency === 'BTC' ? 3 : 12,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await payment.save();

    return {
      paymentId: (payment._id as any).toString(),
      amount: cryptoAmount,
      currency: request.currency,
      walletAddress: config.cryptoWallet.address,
      qrCode: config.cryptoWallet.qrCode,
      expiresAt: payment.expiresAt,
      exchangeRate,
      usdAmount: config.amount
    };
  }

  static async verifyPayment(paymentId: string, transactionHash: string): Promise<boolean> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // In a real implementation, you would verify the transaction on the blockchain
    // For now, we'll simulate verification
    const isValid = await this.simulateBlockchainVerification(transactionHash, payment);

    if (isValid) {
      payment.transactionHash = transactionHash;
      payment.status = 'confirmed';
      payment.paidAt = new Date();
      payment.confirmations = payment.requiredConfirmations;
      await payment.save();
      return true;
    }

    return false;
  }

  private static async simulateBlockchainVerification(
    transactionHash: string, 
    payment: IPayment
  ): Promise<boolean> {
    // Simulate blockchain verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic validation - in real implementation, check blockchain
    return transactionHash.length >= 64 && !!transactionHash.match(/^[a-fA-F0-9]+$/);
  }

  static async getPaymentStatus(paymentId: string): Promise<IPayment | null> {
    return await Payment.findById(paymentId);
  }

  static async expireOldPayments(): Promise<void> {
    await Payment.updateMany(
      { 
        status: 'pending',
        expiresAt: { $lt: new Date() }
      },
      { 
        status: 'expired' 
      }
    );
  }

  static async generatePaymentReceipt(paymentId: string): Promise<any> {
    const payment = await Payment.findById(paymentId)
      .populate('userId', 'name email')
      .populate('applicationId');

    if (!payment || payment.status !== 'confirmed') {
      throw new Error('Payment not found or not confirmed');
    }

    return {
      receiptId: `RCP-${payment._id}`,
      paymentId: payment._id,
      user: payment.userId,
      step: payment.step,
      amount: payment.amount,
      currency: payment.currency,
      usdAmount: payment.usdAmount,
      transactionHash: payment.transactionHash,
      paidAt: payment.paidAt,
      status: payment.status
    };
  }

  static async updateExchangeRates(): Promise<void> {
    // In a real implementation, fetch from crypto API
    // For now, simulate rate updates
    console.log('Exchange rates updated');
  }
}