const API = process.env.API_URL ?? 'http://localhost:8080';
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
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function signup(tag) {
  const email = `e2e${tag}${Date.now()}@example.com`;
  const r = await call('POST', '/auth/signup', null, { name: 'E2E Tester', email, password: 'secret123' });
  if (!r.data?.token) throw new Error(`Signup failed (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data.token;
}

async function main() {
  console.log(`Testing ${API}\n`);

  // 1. Movies
  const movies = await call('GET', '/movies');
  check('10 movies on the server', Array.isArray(movies.data) && movies.data.length === 10, `got ${movies.data?.length}`);
  check('movie 2 is Oppenheimer', movies.data?.[1]?.title === 'Oppenheimer', movies.data?.[1]?.title);

  // 2. Accounts
  const tokenA = await signup('a');
  const tokenB = await signup('b');
  check('two accounts created', !!tokenA && !!tokenB);

  // 3. Showtimes for Oppenheimer
  const shows = await call('GET', '/showtimes?movieId=2');
  const showtime = shows.data?.[0];
  check('showtimes found for movie 2', !!showtime, `status ${shows.status}`);
  if (!showtime) return;
  const id = showtime.id;
  console.log(`      using showtime ${id} (${showtime.cinema_name}, ${showtime.starts_at}, ${showtime.price_etb} ETB)\n`);

  // 4. Pick two free seats from the grid
  const grid = await call('GET', `/showtimes/${id}/seats`, tokenA);
  const free = grid.data.rows.flatMap((r) => r.seats).filter((s) => s.status === 'free').map((s) => s.id);
  check('at least 2 free seats', free.length >= 2, `free: ${free.length}`);
  const seats = free.slice(-2);
  console.log(`      seats: ${seats.join(', ')}\n`);

  // 5. Hold
  const hold = await call('POST', `/showtimes/${id}/seats/hold`, tokenA, { seats });
  check('hold works', hold.status < 300 && hold.data?.seats?.length === 2, JSON.stringify(hold.data));

  const other = await call('POST', `/showtimes/${id}/seats/hold`, tokenB, { seats });
  check('second user cannot hold the same seats (409)', other.status === 409, `status ${other.status}`);

  // 6. Quote
  const snacks = { popcorn: 1, soda: 2 };
  const quote = await call('POST', '/bookings/quote', tokenA, { showtimeId: id, snacks, promoCode: 'YUSA10' });
  const subtotal = showtime.price_etb * 2 + 800;
  const expected = subtotal - Math.round(subtotal * 0.1) + 75;
  check(`quote total is ${expected} ETB`, quote.data?.total_etb === expected, `got ${quote.data?.total_etb}`);

  const fake = await call('POST', '/bookings/quote', tokenA, { showtimeId: id, promoCode: 'FAKE' });
  check('fake promo code rejected (400)', fake.status === 400, `status ${fake.status}`);

  const bad = await call('POST', '/bookings/quote', tokenA, { showtimeId: id, snacks: { popcorn: -5 } });
  check('negative snack quantity rejected (400)', bad.status === 400, `status ${bad.status}`);

  // 7. Book
  const booking = await call('POST', '/bookings', tokenA, {
    showtimeId: id,
    method: 'telebirr',
    snacks,
    promoCode: 'YUSA10',
  });
  check('booking created', booking.status < 300 && !!booking.data?.code, JSON.stringify(booking.data));
  check('booking code format', /^YC[A-Z2-9]{6}$/.test(booking.data?.code ?? ''), booking.data?.code);
  check('booking total equals quote', booking.data?.total_etb === expected, `got ${booking.data?.total_etb}`);
  check('booking is marked paid', booking.data?.paid === true);

  // 8. After booking
  const again = await call('POST', '/bookings', tokenA, { showtimeId: id, method: 'telebirr' });
  check('booking again without a hold rejected (400)', again.status === 400, `status ${again.status}`);

  const gridB = await call('GET', `/showtimes/${id}/seats`, tokenB);
  const statusOf = (s) => gridB.data.rows.flatMap((r) => r.seats).find((x) => x.id === s)?.status;
  check('booked seats show as taken to other users', seats.every((s) => statusOf(s) === 'taken'), seats.map(statusOf).join(','));

  const list = await call('GET', '/bookings', tokenA);
  check('booking appears in my bookings', list.data?.some((b) => b.code === booking.data?.code));

  const mine = list.data?.find((b) => b.code === booking.data?.code);
  check('booking list includes the movie id', mine?.movie_id === 2, JSON.stringify(mine));
  check('booking list includes cinema and seats', !!mine?.cinema_name && mine?.seats?.length === 2, JSON.stringify(mine));

  const none = await call('GET', '/bookings', tokenB);
  check('other user does not see my booking', Array.isArray(none.data) && none.data.length === 0);

  // 8b. Cancel
  const stranger = await call('DELETE', `/bookings/${booking.data?.code}`, tokenB);
  check('other user cannot cancel my booking (404)', stranger.status === 404, `status ${stranger.status}`);

  const cancel = await call('DELETE', `/bookings/${booking.data?.code}`, tokenA);
  check('cancel works', cancel.status < 300 && cancel.data?.cancelled === true, JSON.stringify(cancel.data));

  const gridAfter = await call('GET', `/showtimes/${id}/seats`, tokenB);
  const statusAfter = (s) => gridAfter.data.rows.flatMap((r) => r.seats).find((x) => x.id === s)?.status;
  check('cancelled seats are free again', seats.every((s) => statusAfter(s) === 'free'), seats.map(statusAfter).join(','));

  const listAfter = await call('GET', '/bookings', tokenA);
  check('cancelled booking leaves my list', !listAfter.data?.some((b) => b.code === booking.data?.code));

  const twice = await call('DELETE', `/bookings/${booking.data?.code}`, tokenA);
  check('cancelling twice is harmless', twice.status < 300 && twice.data?.cancelled === true, `status ${twice.status}`);

  // 9. Security
  const noToken = await call('POST', '/bookings', null, { showtimeId: id, method: 'cash' });
  check('booking without a token rejected (401)', noToken.status === 401, `status ${noToken.status}`);
}

main()
  .catch((e) => {
    failed++;
    console.log(`\nERROR  ${e.message}`);
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
  });