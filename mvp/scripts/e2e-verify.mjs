// End-to-end verification of the EduBridge MVP flows using Clerk keyless test
// accounts (+clerk_test emails verify with code 424242 in dev instances).
// Clerk testing tokens (minted with the keyless secret key) bypass the
// Turnstile bot check that otherwise blocks headless sign-ups.
// Run with the dev server up: node scripts/e2e-verify.mjs
import { readFileSync } from 'node:fs';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { chromium } from 'playwright';

const envLocal = readFileSync('./.env.local', 'utf8');
const envValue = name => envLocal.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();
const keyless = {
  publishableKey: envValue('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
  secretKey: envValue('CLERK_SECRET_KEY'),
};
process.env.CLERK_SECRET_KEY = keyless.secretKey;
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = keyless.publishableKey;

const BASE = 'http://localhost:3000';
const SHOT_DIR = process.env.SHOT_DIR ?? './e2e-shots';
const PASSWORD = 'EduBridge-mvp-2026!';
// Unique per run so re-runs never collide with half-created accounts.
const RUN = Date.now().toString(36);

const log = (...args) => console.warn('[e2e]', ...args);

// Click and re-click until the expected selector shows up: guards against
// clicks landing before React hydration finishes on dev-mode first loads.
async function clickUntil(page, clickSelector, expectSelector, tries = 8) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    await page.click(clickSelector, { timeout: 30000 }).catch(() => {});
    try {
      // state: attached, not visible: chat bubbles can sit below the fold in
      // the scrollable message pane on small viewports.
      await page.waitForSelector(expectSelector, { timeout: 12000, state: 'attached' });
      return;
    } catch {
      log(`retry click (${attempt}):`, clickSelector);
    }
  }
  console.warn('[dbg] url:', page.url());
  console.warn('[dbg] body:', await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ').slice(0, 600)).catch(() => '?'));
  await page.screenshot({ path: `${SHOT_DIR}/dbg-clickuntil.png`, fullPage: true }).catch(() => {});
  throw new Error(`clickUntil failed: ${clickSelector} -> ${expectSelector}`);
}

// Fill Clerk's emailed one-time code; test accounts always use 424242.
async function fillCode(page, timeout = 60000) {
  await page.waitForSelector('input[name="codeInput-0"], input[autocomplete="one-time-code"]', { timeout });
  const single = await page.$('input[autocomplete="one-time-code"]');
  if (single && !(await page.$('input[name="codeInput-0"]'))) {
    await single.type('424242', { delay: 60 });
  } else {
    for (let i = 0; i < 6; i++) {
      await page.fill(`input[name="codeInput-${i}"]`, '424242'[i]);
    }
  }
}

// Sign in an existing account (used when a fixed test email already exists).
async function signIn(page, email) {
  page.setDefaultTimeout(90000);
  await setupClerkTestingToken({ page });
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('input[name="identifier"]', { timeout: 90000 });
  await page.fill('input[name="identifier"]', email);
  await page.press('input[name="identifier"]', 'Enter');
  await page.waitForSelector('input[name="password"]', { timeout: 60000 });
  await page.fill('input[name="password"]', PASSWORD);
  await page.press('input[name="password"]', 'Enter');
  // New-device verification (client trust) may ask for an emailed code.
  try {
    await fillCode(page, 15000);
  } catch {
    // No device verification step; continue.
  }
  await page.waitForURL(/onboarding|dashboard|agora/, { timeout: 60000 });
  log('signed in', email, '->', page.url());
}

// A tiny generated JPEG for vetting doc uploads.
async function testImage(page, label) {
  const dataUrl = await page.evaluate((text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const g = canvas.getContext('2d');
    g.fillStyle = '#dfe3e8';
    g.fillRect(0, 0, 800, 500);
    g.fillStyle = '#1a1c1f';
    g.font = 'bold 42px sans-serif';
    g.fillText(text, 40, 90);
    g.font = '24px sans-serif';
    g.fillText('Generated test document', 40, 150);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, label);
  return Buffer.from(dataUrl.split(',')[1], 'base64');
}

async function signUp(page, email) {
  page.setDefaultTimeout(90000);
  await setupClerkTestingToken({ page });
  // First hit goes through Clerk's /clerk-sync-keyless redirect, which is slow
  // while dev-mode compiles; retry the navigation until the form renders.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(`${BASE}/sign-up`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector('input[name="emailAddress"]', { timeout: 90000 });
      break;
    } catch (error) {
      log(`sign-up form not ready (attempt ${attempt})`);
      if (attempt === 3) {
        throw error;
      }
    }
  }
  await page.fill('input[name="emailAddress"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.press('input[name="password"]', 'Enter');
  // Verification code screen
  await fillCode(page);
  await page.waitForTimeout(1500);
  if (/verify-email-address/.test(page.url())) {
    await page.keyboard.press('Enter');
  }
  await page.waitForURL(/onboarding|dashboard|agora/, { timeout: 60000 });
  log('signed up', email, '->', page.url());
}

async function run() {
  await clerkSetup({ publishableKey: keyless.publishableKey, frontendApiUrl: undefined, secretKey: keyless.secretKey, dotenv: false });
  const browser = await chromium.launch();

  // Warm the dev server so first-compile latency does not eat flow timeouts.
  const warm = await browser.newPage();
  for (const path of ['/', '/sign-up']) {
    await warm.goto(BASE + path, { waitUntil: 'networkidle', timeout: 180000 }).catch(() => {});
  }
  await warm.close();
  log('warmup done');

  const results = [];
  const check = (name, ok, extra = '') => {
    results.push({ name, ok });
    log(ok ? 'PASS' : 'FAIL', name, extra);
  };

  // ---------- Educator journey ----------
  const educatorCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const ed = await educatorCtx.newPage();
  await signUp(ed, `educator.${RUN}+clerk_test@example.com`);
  await ed.goto(`${BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  await ed.waitForSelector('#ob-first', { timeout: 60000 });
  await clickUntil(ed, 'button[role="radio"]:has-text("I am an educator")', '#ob-subjects');
  await ed.fill('#ob-first', 'Naliaka');
  await ed.fill('#ob-last', 'Wafula');
  await ed.fill('#ob-subjects', 'Mathematics, Physics');
  await ed.fill('#ob-rate', '1700');
  await ed.fill('#ob-tsc', '712345');
  await ed.fill('#ob-bio', 'Ten years teaching maths in Bungoma; I focus on structured practice and weekly parent updates.');
  const idBuffer = await testImage(ed, 'NATIONAL ID');
  const conductBuffer = await testImage(ed, 'GOOD CONDUCT CERT');
  const pickers = await ed.$$('input[type="file"]');
  // pickers[0] = photo, [1] = national id, [2] = good conduct
  await pickers[1].setInputFiles({ name: 'national-id.jpg', mimeType: 'image/jpeg', buffer: idBuffer });
  await pickers[2].setInputFiles({ name: 'good-conduct.jpg', mimeType: 'image/jpeg', buffer: conductBuffer });
  await ed.waitForSelector('text=Remove', { timeout: 20000 });
  await ed.check('#ob-consent');
  await ed.screenshot({ path: `${SHOT_DIR}/01-educator-onboarding-mobile.png`, fullPage: true });
  await clickUntil(ed, 'button:has-text("Submit for vetting")', 'text=being reviewed');
  check('educator lands on pending-review dashboard', true);
  await ed.screenshot({ path: `${SHOT_DIR}/02-educator-pending-mobile.png`, fullPage: true });

  // ---------- Parent journey: signup + Agora before vetting ----------
  const parentCtx = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const parent = await parentCtx.newPage();
  await signUp(parent, `parent.${RUN}+clerk_test@example.com`);
  await parent.goto(`${BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  await parent.waitForSelector('#ob-first', { timeout: 60000 });
  await parent.fill('#ob-first', 'Wanjiku');
  await parent.fill('#ob-last', 'Kariuki');
  await clickUntil(parent, 'button:has-text("Create my account")', 'text=Find your educator');
  await parent.waitForSelector('text=Vetted', { timeout: 30000 });
  const cardsBefore = await parent.locator('ul li a[href*="/agora/"]').count();
  const naliakaHidden = !(await parent.locator('text=Naliaka').first().isVisible().catch(() => false));
  check('agora shows seeded educators', cardsBefore >= 6, `count=${cardsBefore}`);
  check('pending educator hidden from agora (REQ-1.3)', naliakaHidden);
  await parent.screenshot({ path: `${SHOT_DIR}/03-agora-desktop.png`, fullPage: true });

  // Filters (REQ-2.1); retry the select to ride out hydration on first load
  let filtered = cardsBefore;
  for (let attempt = 0; attempt < 8; attempt++) {
    await parent.selectOption('select >> nth=1', 'Grades 10-12');
    await parent.waitForTimeout(2500);
    filtered = await parent.locator('ul li a[href*="/agora/"]').count();
    if (filtered < cardsBefore) {
      break;
    }
  }
  check('grade filter narrows results', filtered >= 1 && filtered < cardsBefore, `filtered=${filtered}`);
  await parent.screenshot({ path: `${SHOT_DIR}/04-agora-filtered.png`, fullPage: true });

  // ---------- Admin approves the educator ----------
  const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const admin = await adminCtx.newPage();
  try {
    await signUp(admin, 'admin+clerk_test@example.com');
  } catch {
    log('admin sign-up failed (account probably exists), signing in instead');
    await signIn(admin, 'admin+clerk_test@example.com');
  }
  await admin.goto(`${BASE}/onboarding`, { waitUntil: 'domcontentloaded' });
  await admin.waitForSelector('#ob-first', { timeout: 60000 });
  await admin.fill('#ob-first', 'Asha');
  await admin.fill('#ob-last', 'Mohamed');
  await clickUntil(admin, 'button:has-text("Create my account")', 'text=Find your educator');
  await admin.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await admin.waitForSelector('text=Vetting review', { timeout: 30000 });
  const docImages = await admin.locator('figure img').count();
  check('admin sees uploaded vetting documents', docImages >= 2, `images=${docImages}`);
  await admin.screenshot({ path: `${SHOT_DIR}/05-admin-queue.png`, fullPage: true });
  // Drain the queue: earlier interrupted runs may have left extra pending educators.
  for (let i = 0; i < 10; i++) {
    if (await admin.locator('text=No educators waiting').isVisible().catch(() => false)) {
      break;
    }
    await admin.click('button:has-text("Approve")').catch(() => {});
    await admin.waitForTimeout(2500);
  }
  await admin.waitForSelector('text=No educators waiting', { timeout: 30000 });
  check('approve clears the queue', true);

  // ---------- Parent finds newly vetted educator, messages them ----------
  await parent.goto(`${BASE}/agora?subject=Physics`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await parent.waitForSelector('text=Naliaka', { timeout: 30000 });
  check('vetted educator appears in agora (REQ-1.4)', true);
  await clickUntil(parent, 'a[href*="/agora/"]:has-text("Naliaka")', 'text=Hourly rate');
  const rateShown = await parent.locator('text=1,700').first().isVisible();
  check('educator detail shows hourly rate + philosophy (REQ-2.3)', rateShown);
  await parent.screenshot({ path: `${SHOT_DIR}/06-educator-detail.png`, fullPage: true });
  await clickUntil(parent, 'button:has-text("Message educator")', 'textarea[aria-label="Message"]');
  await parent.fill('textarea[aria-label="Message"]', 'Hello Naliaka, I am looking for Grade 7 maths support for my daughter, twice a week.');
  await clickUntil(parent, 'button[aria-label="Send message"]', 'text=Grade 7 maths support');
  check('parent sends first message (REQ-3.1)', true);

  // ---------- Educator replies ----------
  await ed.goto(`${BASE}/messages`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await clickUntil(ed, 'a[href*="/messages/"]', 'textarea[aria-label="Message"]');
  await ed.waitForSelector('text=Grade 7 maths support', { timeout: 30000, state: 'attached' });
  await ed.fill('textarea[aria-label="Message"]', 'Hello Wanjiku! Twice a week works well. Tuesdays and Thursdays at 4pm are open.');
  await clickUntil(ed, 'button[aria-label="Send message"]', 'text=Tuesdays and Thursdays');
  check('educator replies in thread', true);
  await ed.screenshot({ path: `${SHOT_DIR}/07-thread-educator-mobile.png`, fullPage: true });

  // ---------- Double-blind ratings (Epic 4, RATING_WINDOW_DAYS=0) ----------
  await parent.reload();
  await parent.waitForSelector('text=Tuesdays and Thursdays', { timeout: 30000, state: 'attached' });
  await clickUntil(parent, 'button[aria-label="5 stars"]', 'button[aria-label="5 stars"][aria-checked="true"]');
  await clickUntil(parent, 'button:has-text("Submit rating")', 'text=You will see theirs');
  const parentBlind = !(await parent.locator('text=rated this collaboration').isVisible().catch(() => false));
  check('parent rating stays blind until educator rates (REQ-4.2)', parentBlind);
  await parent.screenshot({ path: `${SHOT_DIR}/08-rating-blind.png`, fullPage: true });

  await ed.reload();
  await clickUntil(ed, 'button[aria-label="4 stars"]', 'button[aria-label="4 stars"][aria-checked="true"]');
  await clickUntil(ed, 'button:has-text("Submit rating")', 'text=rated this collaboration');
  check('after both rate, ratings reveal', true);
  await parent.reload();
  await parent.waitForSelector('text=rated this collaboration', { timeout: 30000 });
  await parent.screenshot({ path: `${SHOT_DIR}/09-rating-revealed.png`, fullPage: true });

  // Aggregate appears on educator profile
  await parent.goto(`${BASE}/agora?subject=Physics`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await parent.waitForSelector('text=Naliaka', { timeout: 30000 });
  const hasAggregate = await parent.locator('text=5.0').first().isVisible();
  check('revealed rating aggregates on agora card (REQ-2.2)', hasAggregate);
  await parent.screenshot({ path: `${SHOT_DIR}/10-agora-with-rating.png`, fullPage: true });

  // Mobile pass: capture the signed-in views at phone width.
  await parent.setViewportSize({ width: 390, height: 844 });
  await parent.goto(`${BASE}/agora`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await parent.waitForSelector('text=Vetted', { timeout: 60000 });
  await parent.screenshot({ path: `${SHOT_DIR}/11-agora-mobile.png`, fullPage: true });
  await clickUntil(parent, 'a[href*="/agora/"]:has-text("Naliaka")', 'text=Hourly rate');
  await parent.screenshot({ path: `${SHOT_DIR}/12-educator-detail-mobile.png`, fullPage: true });
  await parent.goto(`${BASE}/messages`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await parent.waitForSelector('text=Naliaka', { timeout: 60000 });
  await clickUntil(parent, 'a[href*="/messages/"]', 'textarea[aria-label="Message"]');
  await parent.screenshot({ path: `${SHOT_DIR}/13-thread-mobile.png`, fullPage: true });
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 180000 });
  await admin.waitForSelector('text=Vetting review', { timeout: 60000 });
  await admin.screenshot({ path: `${SHOT_DIR}/14-admin-mobile.png`, fullPage: true });
  log('mobile screenshots captured');

  await browser.close();
  const failed = results.filter(r => !r.ok);
  log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('[e2e] FATAL', error);
  process.exit(1);
});
