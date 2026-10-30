import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const API = process.env.API_URL ?? 'http://localhost:8080';
const FAKE = process.env.FAKE_CHAPA_URL ?? 'http://localhost:4010';
const FAKE_SCRIPT = fileURLToPath(new URL('./fake-chapa.mjs', import.meta.url));
let fakeProcess = null;
let passed = 0;
let failed = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? '  ->  ' + detail : ''}`);
  }
}

async function call(method, path, token, body) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new Error(`Cannot reach the backend at ${API}${path} (${e.cause?.code ?? e.message}). Is it running?`);
  }
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function fake(path, method = 'GET', body) {
  const res = await fetch(FAKE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function signup(tag) {
  const email = `pay${tag}${Date.now()}@example.com`;
  const r = await call('POST', '/auth/signup', null, { name: 'Pay Tester', email, password: 'secret123' });
  if (!r.data?.token) throw new Error(`Signup failed (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data.token;
}

async function main() {
  console.log(`Testing ${API} with fake Chapa at ${FAKE}\n`);

  // Start the fake Chapa server ourselves when it is not already running.
  const fakeIsUp = async () => (await fake('/health').catch(() => null))?.status === 200;
  if (!(await fakeIsUp())) {
    fakeProcess = spawn(process.execPath, [FAKE_SCRIPT], { stdio: 'ignore' });
    for (let i = 0; i < 30 && !(await fakeIsUp()); i++) await new Promise((r) => setTimeout(r, 200));
    if (!(await fakeIsUp())) throw new Error('Could not start the fake Chapa server.');
  }

  const tokenA = await signup('a');
  const tokenB = await signup('b');

  const shows = await call('GET', '/showtimes?movieId=3');
  const showtime = shows.data?.[0];
  check('showtimes found', !!showtime, `status ${shows.status}`);
  if (!showtime) return;
  const id = showtime.id;

  const grid = await call('GET', `/showtimes/${id}/seats`, tokenA);
  const freeRegular = grid.data.rows
    .flatMap((r) => r.seats)
    .filter((s) => s.status === 'free' && !s.vip)
    .map((s) => s.id);
  check('4 free regular seats', freeRegular.length >= 4, `free: ${freeRegular.length}`);
  if (freeRegular.length < 4) return;
  const seats1 = freeRegular.slice(-2);
  const seats2 = freeRegular.slice(-4, -2);

  const snacks = { popcorn: 1, soda: 2 };
  const body = { showtimeId: id, snacks, promoCode: 'YUSA10' };

  // Guards
  const noToken = await call('POST', '/payments/initialize', null, body);
  check('initialize without a token rejected (401)', noToken.status === 401, `status ${noToken.status}`);

  const noHold = await call('POST', '/payments/initialize', tokenA, body);
  check('initialize without a seat hold rejected (400)', noHold.status === 400, `status ${noHold.status}`);

  // Payment 1: the customer pays the wrong amount
  await call('POST', `/showtimes/${id}/seats/hold`, tokenA, { seats: seats1 });
  const quote1 = await call('POST', '/bookings/quote', tokenA, body);
  const init1 = await call('POST', '/payments/initialize', tokenA, body);
  check(
    'initialize returns a checkout link',
    init1.status < 300 && typeof init1.data?.checkout_url === 'string' && !!init1.data?.tx_ref,
    JSON.stringify(init1.data),
  );
  check('initialize total equals the quote', init1.data?.total_etb === quote1.data?.total_etb, `got ${init1.data?.total_etb}`);

  const sent = await fake(`/test/tx/${init1.data?.tx_ref}`);
  check(
    'provider got ETB, the right amount and the key',
    sent.data?.currency === 'ETB' &&
      Number(sent.data?.amount) === quote1.data?.total_etb &&
      String(sent.data?.auth).startsWith('Bearer '),
    JSON.stringify(sent.data),
  );
  check('provider got a return url', String(sent.data?.return_url).endsWith('/payments/done'), String(sent.data?.return_url));

  await fake(`/test/pay/${init1.data?.tx_ref}`, 'POST', { amount: (quote1.data?.total_etb ?? 0) - 1 });
  const bad = await call('POST', `/payments/verify/${init1.data?.tx_ref}`, tokenA);
  check('wrong paid amount rejected (409)', bad.status === 409, `status ${bad.status}`);

  const badAgain = await call('POST', `/payments/verify/${init1.data?.tx_ref}`, tokenA);
  check('a rejected payment stays rejected (409)', badAgain.status === 409, `status ${badAgain.status}`);

  // Payment 2: the happy path
  await call('POST', `/showtimes/${id}/seats/hold`, tokenA, { seats: seats2 });
  const quote2 = await call('POST', '/bookings/quote', tokenA, body);
  const init2 = await call('POST', '/payments/initialize', tokenA, body);
  const tx2 = init2.data?.tx_ref;

  const early = await call('POST', `/payments/verify/${tx2}`, tokenA);
  check('verify before paying says pending', early.status < 300 && early.data?.status === 'pending', JSON.stringify(early.data));

  const stranger = await call('POST', `/payments/verify/${tx2}`, tokenB);
  check('other user cannot verify my payment (404)', stranger.status === 404, `status ${stranger.status}`);

  await fake(`/test/pay/${tx2}`, 'POST', { amount: quote2.data?.total_etb });
  const done = await call('POST', `/payments/verify/${tx2}`, tokenA);
  check(
    'verify after paying creates the booking',
    done.data?.status === 'paid' && /^YC[A-Z2-9]{6}$/.test(done.data?.booking?.code ?? ''),
    JSON.stringify(done.data),
  );
  check('booking total equals the quote', done.data?.booking?.total_etb === quote2.data?.total_etb, `got ${done.data?.booking?.total_etb}`);
  check(
    'booking has the held seats',
    JSON.stringify(done.data?.booking?.seats) === JSON.stringify([...seats2].sort()),
    JSON.stringify(done.data?.booking?.seats),
  );

  const again = await call('POST', `/payments/verify/${tx2}`, tokenA);
  check(
    'verifying twice is harmless (same booking)',
    again.data?.status === 'paid' && again.data?.booking?.code === done.data?.booking?.code,
    JSON.stringify(again.data),
  );

  const list = await call('GET', '/bookings', tokenA);
  const mine = list.data?.find((b) => b.code === done.data?.booking?.code);
  check('booking appears in my bookings as a chapa payment', !!mine && mine.method === 'chapa' && mine.paid === true, JSON.stringify(mine));

  const gridB = await call('GET', `/showtimes/${id}/seats`, tokenB);
  const statusOf = (s) => gridB.data.rows.flatMap((r) => r.seats).find((x) => x.id === s)?.status;
  check('paid seats show as taken to other users', seats2.every((s) => statusOf(s) === 'taken'), seats2.map(statusOf).join(','));

  const unknown = await call('POST', '/payments/verify/YCP-doesnotexist', tokenA);
  check('unknown payment reference rejected (404)', unknown.status === 404, `status ${unknown.status}`);
}

main()
  .catch((e) => {
    failed++;
    console.log(`\nERROR  ${e.message}`);
  })
  .finally(() => {
    fakeProcess?.kill();
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });