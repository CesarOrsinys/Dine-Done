import { IPaymentGateway, PaymentRequest, PaymentResult } from '../../core/ports/IPaymentGateway.js';

export class StripePaymentGatewayMock implements IPaymentGateway {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate real network latency (100ms)
    await new Promise(resolve => setTimeout(resolve, 80));

    if (request.amount <= 0) {
      throw new Error('El importe a cobrar debe ser superior a 0.');
    }

    const txId = `ch_stripe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      transactionId: txId,
      amountCharged: request.amount,
      tipCharged: request.tip,
      processedAt: new Date()
    };
  }
}
