declare module 'payu-websdk' {
  type PayUEnv = 'TEST' | 'PROD';

  interface PayUHasher {
    generatePaymentHash(params: Record<string, string>): string;
    generateResponseHash(params: Record<string, string | undefined>): string;
    validateResponseHash(params: Record<string, string | undefined>): boolean;
  }

  export default class PayU {
    constructor(
      credentials: { key: string; salt: string },
      env?: PayUEnv,
      config?: Record<string, unknown>
    );

    hasher: PayUHasher;

    paymentInitiate(params?: Record<string, string>): string;
    verifyPayment(txnid: string): Promise<Record<string, unknown>>;
  }
}
