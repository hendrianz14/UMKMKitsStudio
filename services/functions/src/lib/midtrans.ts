import crypto from 'node:crypto';
import midtransClient from 'midtrans-client';

export interface SnapTransactionParams {
  orderId: string;
  amount: number;
  customer: {
    firstName: string;
    email: string;
  };
  itemDetails?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
}

function ensureKeys() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) {
    throw new Error('Midtrans keys are not configured.');
  }
  return { serverKey, clientKey };
}

export function verifySignature({
  order_id,
  status_code,
  gross_amount,
  signature_key
}: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const { serverKey } = ensureKeys();
  const signature = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + serverKey)
    .digest('hex');
  return signature === signature_key;
}

export async function createSnap({ orderId, amount, customer, itemDetails = [] }: SnapTransactionParams) {
  const { serverKey, clientKey } = ensureKeys();
  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey,
    clientKey
  });

  const transaction = await snap.createTransaction({
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: customer.firstName,
      email: customer.email
    },
    item_details: itemDetails
  });

  return transaction;
}
