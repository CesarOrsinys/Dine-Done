export interface PaymentRequest {
  amount: number;
  tip: number;
  currency?: string;
  token?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amountCharged: number;
  tipCharged: number;
  processedAt: Date;
}

export interface IPaymentGateway {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
}
