import http from 'node:http';

// A stand-in for Chapa, only for testing our own payment code on this PC.
const PORT = Number(process.env.FAKE_CHAPA_PORT ?? 4010);
const payments = new Map();

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });

  // Same shape as Chapa: POST /v1/transaction/initialize
  if (req.method === 'POST' && url.pathname === '/v1/transaction/initialize') {
    const auth = req.headers.authorization ?? '';
    if (!auth.startsWith('Bearer ')) return send(res, 401, { message: 'Invalid API Key', status: 'failed', data: null });
    const body = await readJson(req);
    if (!body.tx_ref || !body.amount) {
      return send(res, 400, { message: 'tx_ref and amount are required', status: 'failed', data: null });
    }
    payments.set(body.tx_ref, { request: body, auth, paid: false, paidAmount: null });
    return send(res, 200, {
      message: 'Hosted Link',
      status: 'success',
      data: { checkout_url: `http://localhost:${PORT}/checkout/${body.tx_ref}` },
    });
  }

  // Same shape as Chapa: GET /v1/transaction/verify/:tx_ref (404 until the customer has paid)
  if (req.method === 'GET' && parts[0] === 'v1' && parts[1] === 'transaction' && parts[2] === 'verify' && parts[3]) {
    const ref = decodeURIComponent(parts[3]);
    const p = payments.get(ref);
    if (!p || !p.paid) return send(res, 404, { message: 'Payment not paid yet', status: 'failed', data: null });
    return send(res, 200, {
      message: 'Payment details',
      status: 'success',
      data: {
        status: 'success',
        amount: String(p.paidAmount),
        currency: p.request.currency,
        tx_ref: ref,
        method: 'test',
        email: p.request.email,
      },
    });
  }

  // Test helper: pretend the customer paid (optionally a different amount)
  if (req.method === 'POST' && parts[0] === 'test' && parts[1] === 'pay' && parts[2]) {
    const p = payments.get(decodeURIComponent(parts[2]));
    if (!p) return send(res, 404, { message: 'Unknown tx_ref' });
    const body = await readJson(req);
    p.paid = true;
    p.paidAmount = body.amount ?? Number(p.request.amount);
    return send(res, 200, { ok: true });
  }

  // Test helper: what our server sent when it created the payment
  if (req.method === 'GET' && parts[0] === 'test' && parts[1] === 'tx' && parts[2]) {
    const p = payments.get(decodeURIComponent(parts[2]));
    if (!p) return send(res, 404, { message: 'Unknown tx_ref' });
    return send(res, 200, { ...p.request, auth: p.auth, paid: p.paid });
  }

  if (req.method === 'GET' && parts[0] === 'checkout') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('This is the fake Chapa checkout page used for testing.');
  }

  send(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => console.log(`Fake Chapa running on http://localhost:${PORT}`));