import { readFileSync } from 'node:fs';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { chromium } from 'playwright';

const keyless = JSON.parse(readFileSync('./.clerk/.tmp/keyless.json', 'utf8'));
await clerkSetup({ publishableKey: keyless.publishableKey, secretKey: keyless.secretKey, dotenv: false });

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.warn('[console-err]', msg.text().slice(0, 250));
  }
});
await setupClerkTestingToken({ page });
const email = `dbg.${Date.now().toString(36)}+clerk_test@example.com`;
console.warn('[email]', email);
await page.goto('http://localhost:3000/sign-up', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForSelector('input[name="emailAddress"]', { timeout: 90000 });
await page.fill('input[name="emailAddress"]', email);
await page.fill('input[name="password"]', 'EduBridge-mvp-2026!');
await page.press('input[name="password"]', 'Enter');
await page.waitForSelector('input[name="codeInput-0"], input[autocomplete="one-time-code"]', { timeout: 60000 });
console.warn('[stage] code screen at', page.url());
const single = await page.$('input[autocomplete="one-time-code"]');
console.warn('[single-input]', !!single);
if (single && !(await page.$('input[name="codeInput-0"]'))) {
  await single.type('424242', { delay: 80 });
} else {
  for (let i = 0; i < 6; i++) {
    await page.fill(`input[name="codeInput-${i}"]`, '424242'[i]);
  }
}
for (let t = 0; t < 6; t++) {
  await page.waitForTimeout(3000);
  const url = page.url();
  console.warn(`[t+${(t + 1) * 3}s]`, url);
  if (/onboarding|dashboard|agora|sign-in$/.test(url)) {
    break;
  }
}
console.warn('[cookies]', (await page.context().cookies()).map(c => c.name).join(', '));
console.warn('--- direct goto /dashboard ---');
await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => console.warn('goto err', e.message));
await page.waitForTimeout(8000);
console.warn('[url]', page.url());
console.warn('[body]', await page.evaluate(() => document.body?.innerText?.replace(/\n+/g, ' | ').slice(0, 300) ?? ''));
await page.screenshot({ path: './e2e-shots/debug-code.png', fullPage: true });
await browser.close();
