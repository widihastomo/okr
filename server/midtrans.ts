import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { CoreApi, Snap } = require('midtrans-client');

// Konfigurasi Midtrans
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
  console.warn('Midtrans credentials not found. Payment features will not work.');
}

// Core API untuk server-to-server
export const coreApi = new CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!
});

// Snap API untuk redirect payment
export const snap = new Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!
});

export interface MidtransPaymentRequest {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}



export interface MidtransTransactionStatus {
  transaction_status: string;
  status_code: string;
  payment_type: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  fraud_status?: string;
}

/**
 * Membuat transaksi Snap untuk pembayaran (invoice atau upgrade)
 */
export async function createSnapTransaction(paymentData: MidtransPaymentRequest, baseUrl?: string, transactionType: 'invoice' | 'upgrade' = 'invoice') {
  try {
    const parameter = {
      transaction_details: {
        order_id: paymentData.orderId,
        gross_amount: paymentData.grossAmount
      },
      credit_card: {
        secure: true
      },
      customer_details: paymentData.customerDetails,
      item_details: paymentData.itemDetails,
      callbacks: transactionType === 'upgrade' ? {
        finish: `${baseUrl}/upgrade-package?status=success`,
        unfinish: `${baseUrl}/upgrade-package?status=pending`,
        error: `${baseUrl}/upgrade-package?status=error`
      } : {
        finish: `${baseUrl}/invoice-payment-finish?order_id=${paymentData.orderId}`,
        unfinish: `${baseUrl}/invoices`,
        error: `${baseUrl}/invoices`
      }
    };

    const transaction = await snap.createTransaction(parameter);
    return transaction;
  } catch (error: any) {
    console.error('Error creating Midtrans transaction:', error.message);
    
    if (error.ApiResponse?.error_messages) {
      console.error('Midtrans error messages:', error.ApiResponse.error_messages);
      throw new Error(`Midtrans error: ${error.ApiResponse.error_messages.join(', ')}`);
    }
    
    throw new Error(`Failed to create payment transaction: ${error.message}`);
  }
}

/**
 * Mendapatkan status transaksi dari Midtrans
 */
export async function getTransactionStatus(orderId: string): Promise<MidtransTransactionStatus> {
  try {
    const statusResponse = await coreApi.transaction.status(orderId);
    return statusResponse as MidtransTransactionStatus;
  } catch (error) {
    console.error('Error getting transaction status:', error);
    throw new Error('Failed to get transaction status');
  }
}

/**
 * Memverifikasi signature notification dari Midtrans
 */
export function verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  const crypto = require('crypto');
  const input = orderId + statusCode + grossAmount + serverKey;
  return crypto.createHash('sha512').update(input).digest('hex');
}

/**
 * Menentukan status invoice berdasarkan status transaksi Midtrans
 */
export function mapMidtransStatusToInvoiceStatus(transactionStatus: string, fraudStatus?: string): string {
  switch (transactionStatus) {
    case 'capture':
      return fraudStatus === 'challenge' ? 'pending' : 'paid';
    case 'settlement':
      return 'paid';
    case 'pending':
      return 'sent';
    case 'deny':
    case 'cancel':
    case 'expire':
      return 'cancelled';
    case 'failure':
      return 'pending';
    default:
      return 'pending';
  }
}