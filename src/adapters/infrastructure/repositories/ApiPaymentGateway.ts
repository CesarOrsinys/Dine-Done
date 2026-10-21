import { IPaymentGateway, PaymentRequest, PaymentResult } from '../../../core/ports/IPaymentGateway.js';
import { HttpApiClient } from '../api/HttpApiClient.js';

export class ApiPaymentGateway implements IPaymentGateway {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const res = await HttpApiClient.request<{
      success: boolean;
      transactionId: string;
      amountCharged: number;
      tipCharged: number;
      processedAt: string;
      currency?: string;
      provider?: string;
    }>('/api/payments/process', {
      method: 'POST',
      body: JSON.stringify({
        amount: request.amount,
        tip: request.tip,
        currency: request.currency,
        token: request.token
      })
    });

    return {
      success: res.success,
      transactionId: res.transactionId,
      amountCharged: res.amountCharged,
      tipCharged: res.tipCharged,
      processedAt: new Date(res.processedAt)
    };
  }
}
