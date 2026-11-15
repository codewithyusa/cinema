const API = process.env.API_URL ?? 'http://localhost:8080';
// Must match STAFF_KEY and ADMIN_KEY in backend/.env
const STAFF_KEY = process.env.STAFF_KEY ?? 'choose-a-long-secret';
const ADMIN_KEY = process.env.ADMIN_KEY ?? 'choose-a-long-admin-secret';
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

// Staff ticket scan: uses the staff key header instead of a user token.
async function scan(code, key) {
  const res = await fetch(`${API}/staff/verify/${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: key ? { 'x-staff-key': key } : {},
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// Admin calls: use the admin key header instead of a user token.
async function admin(method, path, key, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { 'x-admin-key': key } : {}),
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
  check('at least 10 movies on the server', Array.isArray(movies.data) && movies.data.length >= 10, `got ${movies.data?.length}`);
  check('movie 2 is Oppenheimer', movies.data?.[1]?.title === 'Oppenheimer', movies.data?.[1]?.title);
  check('Dune has a YouTube trailer link', /youtube\.com\/watch\?v=/.test(movies.data?.[0]?.trailer_url ?? ''), movies.data?.[0]?.trailer_url);

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

  // 4. Pick one regular seat and one VIP seat from the grid
  const grid = await call('GET', `/showtimes/${id}/seats`, tokenA);
  const allSeats = grid.data.rows.flatMap((r) => r.seats);
  const freeRegular = allSeats.filter((s) => s.status === 'free' && !s.vip).map((s) => s.id);
  const freeVip = allSeats.filter((s) => s.status === 'free' && s.vip).map((s) => s.id);
  check('a free regular seat and a free VIP seat exist', freeRegular.length >= 1 && freeVip.length >= 1, `regular ${freeRegular.length}, vip ${freeVip.length}`);
  check('VIP price is 1.5 times regular', grid.data.vip_price_etb === Math.round(showtime.price_etb * 1.5), `got ${grid.data.vip_price_etb}`);
  const seats = [freeRegular[freeRegular.length - 1], freeVip[freeVip.length - 1]];
  console.log(`      seats: ${seats.join(', ')}\n`);

  // 5. Hold
  const hold = await call('POST', `/showtimes/${id}/seats/hold`, tokenA, { seats });
  check('hold works', hold.status < 300 && hold.data?.seats?.length === 2, JSON.stringify(hold.data));

  const other = await call('POST', `/showtimes/${id}/seats/hold`, tokenB, { seats });
  check('second user cannot hold the same seats (409)', other.status === 409, `status ${other.status}`);

  // 6. Quote
  const snacks = { popcorn: 1, soda: 2 };
  const quote = await call('POST', '/bookings/quote', tokenA, { showtimeId: id, snacks, promoCode: 'YUSA10' });
  const subtotal = showtime.price_etb + grid.data.vip_price_etb + 800;
  const expected = subtotal - Math.round(subtotal * 0.1) + 75;
  check(`quote total is ${expected} ETB`, quote.data?.total_etb === expected, `got ${quote.data?.total_etb}`);
  check(
    'quote has a VIP seats line',
    quote.data?.lines?.some((l) => l.label === 'VIP seats' && l.unit_etb === grid.data.vip_price_etb),
    JSON.stringify(quote.data?.lines),
  );

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

  // 8a. Staff ticket scan (before the booking is cancelled)
  console.log('');
  const code = booking.data?.code;

  const noKey = await scan(code, null);
  check('scan without a staff key rejected (401)', noKey.status === 401, `status ${noKey.status}`);

  const wrongKey = await scan(code, 'wrong-key');
  check('scan with a wrong staff key rejected (401)', wrongKey.status === 401, `status ${wrongKey.status}`);

  const first = await scan(code, STAFF_KEY);
  check('first scan is valid', first.status < 300 && first.data?.status === 'valid' && first.data?.ticket?.code === code, JSON.stringify(first.data));
  check(
    'scan shows the movie and both seats',
    first.data?.ticket?.movie_title === 'Oppenheimer' && first.data?.ticket?.seats?.length === 2,
    JSON.stringify(first.data?.ticket),
  );

  const second = await scan(code, STAFF_KEY);
  check('second scan says already used', second.data?.status === 'used' && !!second.data?.used_at, JSON.stringify(second.data));

  const lower = await scan(code.toLowerCase(), STAFF_KEY);
  check('lowercase code also says already used', lower.data?.status === 'used', JSON.stringify(lower.data));

  const fakeScan = await scan('YCZZZZZZ', STAFF_KEY);
  check('unknown code says invalid', fakeScan.status < 300 && fakeScan.data?.status === 'invalid', JSON.stringify(fakeScan.data));

  // 8b. Cancel
  console.log('');
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

  const scanCancelled = await scan(code, STAFF_KEY);
  check('cancelled ticket scans as cancelled', scanCancelled.data?.status === 'cancelled', JSON.stringify(scanCancelled.data));

  // 9. Security
  const noToken = await call('POST', '/bookings', null, { showtimeId: id, method: 'cash' });
  check('booking without a token rejected (401)', noToken.status === 401, `status ${noToken.status}`);

  // 10. Reviews (movie 2). Old reviews from earlier runs may exist, so we compare counts.
  console.log('');
  const noTokenReviews = await call('GET', '/movies/2/reviews', null);
  check('reviews without a token rejected (401)', noTokenReviews.status === 401, `status ${noTokenReviews.status}`);

  const base = (await call('GET', '/movies/2/reviews', tokenA)).data?.length ?? 0;

  const reviewA = await call('POST', '/movies/2/reviews', tokenA, { rating: 5, comment: 'Great movie' });
  check(
    'first review saved and marked as mine',
    reviewA.status < 300 && reviewA.data?.length === base + 1 && reviewA.data?.filter((r) => r.mine).length === 1,
    JSON.stringify(reviewA.data),
  );

  const myReviewA = reviewA.data?.find((r) => r.mine);
  check('review author is a name, not an email', !!myReviewA?.author && !myReviewA.author.includes('@'), myReviewA?.author);

  const reviewB = await call('POST', '/movies/2/reviews', tokenB, { rating: 3, comment: 'It was okay' });
  check('second user review is added', reviewB.status < 300 && reviewB.data?.length === base + 2, `got ${reviewB.data?.length}`);

  const listA = await call('GET', '/movies/2/reviews', tokenA);
  const listB = await call('GET', '/movies/2/reviews', tokenB);
  check(
    'each user sees only their own review as mine',
    listA.data?.filter((r) => r.mine).length === 1 &&
      listB.data?.filter((r) => r.mine).length === 1 &&
      listA.data?.find((r) => r.mine)?.rating === 5 &&
      listB.data?.find((r) => r.mine)?.rating === 3,
    `A mine: ${listA.data?.filter((r) => r.mine).length}, B mine: ${listB.data?.filter((r) => r.mine).length}`,
  );

  const replace = await call('POST', '/movies/2/reviews', tokenA, { rating: 4, comment: 'Better on second watch' });
  check(
    'second review from the same user replaces the first',
    replace.data?.length === base + 2 && replace.data?.find((r) => r.mine)?.rating === 4,
    `length ${replace.data?.length}, rating ${replace.data?.find((r) => r.mine)?.rating}`,
  );

  const zero = await call('POST', '/movies/2/reviews', tokenA, { rating: 0 });
  check('rating 0 rejected (400)', zero.status === 400, `status ${zero.status}`);

  const six = await call('POST', '/movies/2/reviews', tokenA, { rating: 6 });
  check('rating 6 rejected (400)', six.status === 400, `status ${six.status}`);

  const noMovie = await call('POST', '/movies/999/reviews', tokenA, { rating: 5 });
  check('review for an unknown movie rejected (404)', noMovie.status === 404, `status ${noMovie.status}`);

  // 11. Watchlist. Both test users are new, so their lists start empty.
  console.log('');
  const wlNoToken = await call('GET', '/watchlist', null);
  check('watchlist without a token rejected (401)', wlNoToken.status === 401, `status ${wlNoToken.status}`);

  const wlStart = await call('GET', '/watchlist', tokenA);
  check('new user has an empty watchlist', Array.isArray(wlStart.data) && wlStart.data.length === 0, JSON.stringify(wlStart.data));

  const wlAdd = await call('POST', '/watchlist/2', tokenA);
  check('movie 2 added to watchlist', wlAdd.status < 300 && wlAdd.data?.[0] === 2, JSON.stringify(wlAdd.data));

  const wlAgain = await call('POST', '/watchlist/2', tokenA);
  check('adding the same movie twice changes nothing', wlAgain.data?.length === 1, JSON.stringify(wlAgain.data));

  const wlSecond = await call('POST', '/watchlist/3', tokenA);
  check('newest movie comes first', wlSecond.data?.[0] === 3 && wlSecond.data?.[1] === 2, JSON.stringify(wlSecond.data));

  const wlOther = await call('GET', '/watchlist', tokenB);
  check('other user does not see my watchlist', Array.isArray(wlOther.data) && wlOther.data.length === 0, JSON.stringify(wlOther.data));

  const wlRemove = await call('DELETE', '/watchlist/2', tokenA);
  check('movie 2 removed from watchlist', wlRemove.status < 300 && wlRemove.data?.length === 1 && wlRemove.data?.[0] === 3, JSON.stringify(wlRemove.data));

  const wlUnknown = await call('POST', '/watchlist/999', tokenA);
  check('unknown movie rejected (404)', wlUnknown.status === 404, `status ${wlUnknown.status}`);

  // 12. Coming soon (public, no login needed)
  console.log('');
  const soon = await call('GET', '/coming-soon');
  check('coming soon list is public and returns an array', soon.status === 200 && Array.isArray(soon.data), `status ${soon.status}`);

  check(
    'coming soon items have title, genre and release date',
    soon.data?.every((m) => m.title && m.genre && /^\d{4}-\d{2}-\d{2}$/.test(m.release_date)),
    JSON.stringify(soon.data?.[0]),
  );

  const dates = soon.data?.map((m) => m.release_date) ?? [];
  check('coming soon is sorted by release date', dates.every((d, i) => i === 0 || dates[i - 1] <= d), dates.join(','));

  const todayStr = new Date().toISOString().slice(0, 10);
  check('coming soon has no past releases', dates.every((d) => d >= todayStr), dates.join(','));

  // 13. Admin. Wrong or missing keys are rejected. We only test movie rules that
  // fail, so the test does not leave extra movies behind.
  console.log('');
  const statsNoKey = await admin('GET', '/admin/stats', null);
  check('stats without an admin key rejected (401)', statsNoKey.status === 401, `status ${statsNoKey.status}`);

  const statsWrong = await admin('GET', '/admin/stats', 'wrong-key');
  check('stats with a wrong admin key rejected (401)', statsWrong.status === 401, `status ${statsWrong.status}`);

  const stats = await admin('GET', '/admin/stats', ADMIN_KEY);
  check(
    'stats returns the sales numbers',
    stats.status === 200 &&
      typeof stats.data?.revenue_etb === 'number' &&
      typeof stats.data?.tickets_sold === 'number' &&
      typeof stats.data?.bookings === 'number' &&
      Array.isArray(stats.data?.per_movie),
    JSON.stringify(stats.data),
  );
  check('stats counts the ticket scanned in this test', stats.data?.scanned_today >= 1, `got ${stats.data?.scanned_today}`);

  const hallsNoKey = await admin('GET', '/admin/halls', null);
  check('halls without an admin key rejected (401)', hallsNoKey.status === 401, `status ${hallsNoKey.status}`);

  const halls = await admin('GET', '/admin/halls', ADMIN_KEY);
  check(
    'halls list has cinema and hall names',
    Array.isArray(halls.data) && halls.data.length >= 2 && halls.data.every((h) => h.id && h.hall_name && h.cinema_name),
    JSON.stringify(halls.data),
  );
  const hallId = halls.data?.[0]?.id;

  const movieOk = { title: 'Oppenheimer', genre: 'Drama', duration_min: 180, rating: 8, synopsis: 'Test synopsis.' };

  const mvNoKey = await admin('POST', '/admin/movies', null, movieOk);
  check('add movie without an admin key rejected (401)', mvNoKey.status === 401, `status ${mvNoKey.status}`);

  const mvMissing = await admin('POST', '/admin/movies', ADMIN_KEY, { title: 'No genre' });
  check('add movie with missing fields rejected (400)', mvMissing.status === 400, `status ${mvMissing.status}`);

  const mvShort = await admin('POST', '/admin/movies', ADMIN_KEY, { ...movieOk, title: 'Too Short', duration_min: 5 });
  check('add movie with duration 5 rejected (400)', mvShort.status === 400, `status ${mvShort.status}`);

  const mvLink = await admin('POST', '/admin/movies', ADMIN_KEY, { ...movieOk, title: 'Bad Link', poster_url: 'ftp://x/y.jpg' });
  check('add movie with a bad poster link rejected (400)', mvLink.status === 400, `status ${mvLink.status}`);

  const mvDup = await admin('POST', '/admin/movies', ADMIN_KEY, movieOk);
  check('add movie with an existing title rejected (409)', mvDup.status === 409, `status ${mvDup.status}`);

  // A showtime far in the future, at a random date and time so reruns do not clash.
  const mm = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const dd = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const hh = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const mi = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const stDate = `2031-${mm}-${dd}`;
  const stTime = `${hh}:${mi}`;
  const stBody = { movieId: 2, hallId, date: stDate, time: stTime, priceEtb: 300 };
  const expectedStart = new Date(Date.UTC(2031, +mm - 1, +dd, +hh - 3, +mi)).toISOString();

  const stAdd = await admin('POST', '/admin/showtimes', ADMIN_KEY, stBody);
  check(
    'showtime added (cinema time is stored as UTC)',
    stAdd.status < 300 && stAdd.data?.movie_title === 'Oppenheimer' && stAdd.data?.starts_at === expectedStart && stAdd.data?.price_etb === 300,
    JSON.stringify(stAdd.data),
  );

  const stList = await call('GET', '/showtimes?movieId=2');
  check('new showtime appears in the public list', stList.data?.some((s) => s.id === stAdd.data?.id), `id ${stAdd.data?.id}`);

  const stDup = await admin('POST', '/admin/showtimes', ADMIN_KEY, stBody);
  check('same hall and time again rejected (409)', stDup.status === 409, `status ${stDup.status}`);

  const stPast = await admin('POST', '/admin/showtimes', ADMIN_KEY, { ...stBody, date: '2020-01-01', time: '10:00' });
  check('showtime in the past rejected (400)', stPast.status === 400, `status ${stPast.status}`);

  const stTimeBad = await admin('POST', '/admin/showtimes', ADMIN_KEY, { ...stBody, time: '25:99' });
  check('showtime with a bad time rejected (400)', stTimeBad.status === 400, `status ${stTimeBad.status}`);

  const stPrice = await admin('POST', '/admin/showtimes', ADMIN_KEY, { ...stBody, priceEtb: 10 });
  check('showtime with price 10 rejected (400)', stPrice.status === 400, `status ${stPrice.status}`);

  const stMovie = await admin('POST', '/admin/showtimes', ADMIN_KEY, { ...stBody, movieId: 9999 });
  check('showtime for an unknown movie rejected (404)', stMovie.status === 404, `status ${stMovie.status}`);

  const stHall = await admin('POST', '/admin/showtimes', ADMIN_KEY, { ...stBody, hallId: 9999 });
  check('showtime for an unknown hall rejected (404)', stHall.status === 404, `status ${stHall.status}`);
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