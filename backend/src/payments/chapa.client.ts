import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import '../common/env';

const baseUrl = () => (process.env.CHAPA_BASE_URL ?? 'https://api.chapa.co/v1').replace(/\/+$/, '');

async function chapa<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{ status: number; data: T | null }> {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key) throw new ServiceUnavailableException('Online payments are not set up yet.');

  let res: Response;
  try {
    res = await fetch(baseUrl() + path, {
      method,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new BadGatewayException('Could not reach the payment provider. Try again.');
  }
  const data = (await res.json().catch(() => null)) as T | null;
  return { status: res.status, data };
}

export type ChapaInitInput = {
  amount: string;
  currency: 'ETB';
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  return_url: string;
  customization?: { title: string; description: string };
};

// Returns the checkout link where the customer pays.
export async function chapaInitialize(input: ChapaInitInput): Promise<string> {
  const r = await chapa<{ data?: { checkout_url?: string } }>('POST', '/transaction/initialize', input);
  const url = r.data?.data?.checkout_url;
  if (r.status >= 300 || !url) throw new BadGatewayException('The payment provider rejected the request.');
  return url;
}

export type ChapaVerified = {
  found: boolean;
  status: string;
  amount: number;
  currency: string;
  tx_ref: string;
};

type VerifyBody = {
  data?: { status?: string; amount?: string | number; currency?: string; tx_ref?: string };
};

export async function chapaVerify(txRef: string): Promise<ChapaVerified> {
  const r = await chapa<VerifyBody>('GET', `/transaction/verify/${encodeURIComponent(txRef)}`);
  // Chapa answers 404 while the payment has not been made yet.
  if (r.status === 404) return { found: false, status: 'pending', amount: 0, currency: '', tx_ref: txRef };
  const d = r.data?.data;
  if (r.status >= 300 || !d) throw new BadGatewayException('Could not check the payment. Try again.');
  return {
    found: true,
    status: String(d.status ?? ''),
    amount: Number(d.amount),
    currency: String(d.currency ?? ''),
    tx_ref: String(d.tx_ref ?? ''),
  };
}