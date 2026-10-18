// End-to-end smoke test for Active Local.
//
// Exercises the running app over real HTTP: public pages, sign-in, favorites,
// event submission → moderation → detail page (including org-level fallbacks),
// plan changes, digest sending, unsubscribe, and registration.
//
// It writes to the local database, so run `npm run db:reset` afterwards if you
// want pristine demo data. Usage:
//
//   npm run build && npm run start     (one terminal)
//   node scripts/smoke.mjs             (another terminal)
//
// Set SMOKE_BASE to point somewhere else, e.g. SMOKE_BASE=https://preview.example
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.SMOKE_BASE || 'http://localhost:3000';
const base = new URL(BASE);
const transport = base.protocol === 'https:' ? https : http;

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass: !!pass });
  if (pass) console.log(`PASS  ${name}`);
  else console.log(`FAIL  ${name}\n       → ${detail}`);
}

function request(method, pathname, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = transport.request(
      {
        hostname: base.hostname,
        port: base.port || (base.protocol === 'https:' ? 443 : 80),
        path: pathname,
        method,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
          Origin: base.origin,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          let session = cookie;
          for (const c of res.headers['set-cookie'] || []) {
            const pair = c.split(';')[0];
            const eq = pair.indexOf('=');
            if (pair.slice(0, eq) === 'active_local_session') {
              const value = pair.slice(eq + 1);
              session = value ? `active_local_session=${value}` : undefined;
            }
          }
          resolve({
            status: res.statusCode,
            text: Buffer.concat(chunks).toString('utf8'),
            session,
            location: res.headers.location,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const get = (p, cookie) => request('GET', p, { cookie });
const post = (p, body, cookie) => request('POST', p, { body, cookie });
const patch = (p, body, cookie) => request('PATCH', p, { body, cookie });

async function login(email, password) {
  const res = await post('/api/auth/login', { email, password });
  check(`sign in as ${email}`, res.status === 200 && !!res.session, `${res.status} ${res.text.slice(0, 120)}`);
  return res.session;
}

/** A future wall-time string, e.g. 2026-10-25T10:00 (matches the app's format). */
function futureWallTime(daysAhead, addDays = 0) {
  const d = new Date(Date.now() + (daysAhead + addDays) * 86_400_000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T10:00`;
}

function baseEvent() {
  return {
    title: 'Smoke Test: Board Game Afternoon',
    description: 'A relaxed afternoon of easy board games with coffee and cookies.',
    category: 'social',
    starts_at: futureWallTime(3),
    ends_at: futureWallTime(3, 0).replace('T10:00', 'T12:00'),
    location_name: '',
    address: '',
    city: '',
    state: '',
    zip: '02118',
    cost_type: 'free',
    cost_amount: 0,
    mobility: 'wheelchair',
    transportation: true,
    seating: true,
    hearing_friendly: true,
    registration_required: false,
    contact_phone: '',
    external_url: '',
    sponsored: false,
  };
}

async function run() {
  console.log(`Active Local smoke test → ${BASE}\n`);

  // ---- Public pages -------------------------------------------------------
  const home = await get('/');
  check('home page loads with site name', home.status === 200 && home.text.includes('Active Local'), `status ${home.status}`);

  for (const p of ['/events', '/pricing', '/providers', '/about', '/accessibility', '/help', '/login', '/register']) {
    const r = await get(p);
    check(`GET ${p} responds 200`, r.status === 200, `status ${r.status}`);
  }

  const missing = await get('/events/999999');
  check('unknown event returns 404', missing.status === 404, `status ${missing.status}`);

  // ---- Signed-out guards --------------------------------------------------
  for (const p of ['/favorites', '/dashboard', '/admin']) {
    const r = await get(p);
    check(`signed-out ${p} redirects`, r.status === 307 && !!r.location, `status ${r.status} location ${r.location}`);
  }

  // ---- Filtering ----------------------------------------------------------
  const byZip = await get('/events?zip=02118');
  check('ZIP filter shows a 02118 activity', byZip.status === 200 && byZip.text.includes('Chair Yoga for Beginners'), `status ${byZip.status}`);

  const byMobility = await get('/events?mobility=wheelchair&free=1');
  check('mobility + free filters respond', byMobility.status === 200 && byMobility.text.includes('activities'), `status ${byMobility.status}`);

  const noMatch = await get('/events?q=zzzznotarealactivity');
  check('empty search shows the helpful empty state', noMatch.status === 200 && noMatch.text.includes('Nothing matched'), `status ${noMatch.status}`);

  // ---- Senior: browse + favorites ----------------------------------------
  const senior = await login('margaret@example.com', 'senior123');
  const favPage = await get('/favorites', senior);
  check('signed-in senior can open /favorites', favPage.status === 200, `status ${favPage.status}`);

  // ---- Provider: submit an event -----------------------------------------
  const provider = await login('provider@example.com', 'provider123');
  const dash = await get('/dashboard', provider);
  check('provider dashboard loads', dash.status === 200 && dash.text.includes('Sunrise Senior Center'), `status ${dash.status}`);

  const created = await post('/api/events', { ...baseEvent(), org_id: 1 }, provider);
  let createdId = 0;
  try {
    createdId = JSON.parse(created.text).id;
  } catch {
    /* handled below */
  }
  check('provider can submit an event', created.status === 200 && createdId > 0, `${created.status} ${created.text.slice(0, 160)}`);

  const pendingDetail = await get(`/events/${createdId}`);
  check('submitted event is hidden until approved', pendingDetail.status === 404, `status ${pendingDetail.status}`);

  // ---- Admin: moderate ----------------------------------------------------
  const admin = await login('admin@example.com', 'admin123');
  const adminPage = await get('/admin', admin);
  check('admin dashboard loads', adminPage.status === 200, `status ${adminPage.status}`);

  const approve = await post('/api/admin/events', { event_id: createdId, action: 'approve' }, admin);
  check('admin can approve the event', approve.status === 200, `${approve.status} ${approve.text.slice(0, 160)}`);

  // ---- Detail page + org-level fallbacks ---------------------------------
  let detail = await get(`/events/${createdId}`);
  check('approved event page loads', detail.status === 200 && detail.text.includes('Board Game Afternoon'), `status ${detail.status}`);
  check('detail shows a tel link', detail.text.includes('tel:'), 'no tel: link found');
  check('detail falls back to the org phone', detail.text.includes('6175550140'), 'org phone missing from detail page');
  check('detail falls back to the org location', detail.text.includes('Sunrise Senior Center'), 'org location missing');

  // ---- Edit regression: a blank phone must not erase the org fallback ----
  const edited = await patch(`/api/events/${createdId}`, {
    ...baseEvent(),
    org_id: 1,
    title: 'Smoke Test: Board Game Afternoon (edited)',
    contact_phone: '',
  }, provider);
  check('provider can edit the event', edited.status === 200, `${edited.status} ${edited.text.slice(0, 160)}`);

  await post('/api/admin/events', { event_id: createdId, action: 'approve' }, admin);
  detail = await get(`/events/${createdId}`);
  check('edited title appears on the detail page', detail.status === 200 && detail.text.includes('(edited)'), `status ${detail.status}`);
  check('edit keeps the org phone fallback (regression)', detail.text.includes('tel:6175550140'), 'phone was lost after edit');

  // ---- Favorites round-trip ----------------------------------------------
  const favAdd = await post('/api/favorites', { event_id: createdId }, senior);
  let favSaved = false;
  try { favSaved = JSON.parse(favAdd.text).saved; } catch { /* handled below */ }
  check('senior can save an event to favorites', favAdd.status === 200 && favSaved === true, `${favAdd.status} ${favAdd.text.slice(0, 140)}`);

  const favList = await get('/favorites', senior);
  check('saved event appears on /favorites', favList.status === 200 && favList.text.includes('Board Game Afternoon'), `status ${favList.status}`);

  const favRemove = await post('/api/favorites', { event_id: createdId }, senior);
  let favRemoved = true;
  try { favRemoved = JSON.parse(favRemove.text).saved; } catch { /* handled below */ }
  check('senior can remove a favorite', favRemove.status === 200 && favRemoved === false, `${favRemove.status} ${favRemove.text.slice(0, 140)}`);

  // ---- Plan changes -------------------------------------------------------
  const toSponsored = await post('/api/organizations/plan', { plan: 'sponsored' }, provider);
  check('provider can switch to the sponsored plan', toSponsored.status === 200, `${toSponsored.status} ${toSponsored.text.slice(0, 140)}`);

  const toProvider = await post('/api/organizations/plan', { plan: 'provider' }, provider);
  check('provider can switch back to the provider plan', toProvider.status === 200, `${toProvider.status} ${toProvider.text.slice(0, 140)}`);

  // ---- Digest + subscribers ----------------------------------------------
  const subscribed = await post('/api/digest/subscribe', { email: `smoke-${Date.now()}@example.com`, zip: '02116' });
  check('a new subscriber can sign up', subscribed.status === 200, `status ${subscribed.status}`);

  const send = await post('/api/admin/digest', {}, admin);
  check('admin can send the weekly digest', send.status === 200, `${send.status} ${send.text.slice(0, 160)}`);

  const outbox = path.join(process.cwd(), 'var', 'outbox');
  const outboxCount = fs.existsSync(outbox) ? fs.readdirSync(outbox).length : 0;
  check('digest produced email output', outboxCount > 0, `outbox has ${outboxCount} file(s)`);

  const unsub = await get('/api/digest/unsubscribe?email=margaret@example.com');
  check('unsubscribe link works', unsub.status === 200 && unsub.text.includes('unsubscribed'), `status ${unsub.status}`);

  // ---- Cron endpoint is locked in production ------------------------------
  const cron = await get('/api/cron/weekly-digest');
  check('cron endpoint is locked without a secret', cron.status === 401 || cron.status === 503, `status ${cron.status}`);

  // ---- Registration -------------------------------------------------------
  const email = `smoke-senior-${Date.now()}@example.com`;
  const reg = await post('/api/auth/register', {
    role: 'senior', full_name: 'Smoke Test Senior', email, password: 'smoketest123', zip: '02118',
  });
  check('a new senior can register', reg.status === 200 && !!reg.session, `${reg.status} ${reg.text.slice(0, 160)}`);
  if (reg.session) {
    const newFav = await get('/favorites', reg.session);
    check('new account session works', newFav.status === 200, `status ${newFav.status}`);
  }

  // ---- Summary ------------------------------------------------------------
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('Failures:');
    for (const f of failed) console.log(`  - ${f.name}`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
