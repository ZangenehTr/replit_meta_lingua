export interface PaymentInitRequest {
  amount: number;
  orderId: string;
  description: string;
  callbackUrl: string;
  customerPhone?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitResponse {
  success: boolean;
  gatewayUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface PaymentVerifyRequest {
  orderId: string;
  transactionId: string;
  amount?: number;
}

export interface PaymentVerifyResponse {
  success: boolean;
  referenceNumber?: string;
  cardNumber?: string;
  amount?: number;
  status: 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface PaymentGateway {
  name: string;
  initiate(request: PaymentInitRequest): Promise<PaymentInitResponse>;
  verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
}
