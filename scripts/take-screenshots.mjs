/**
 * GSS Hospital Pro — Automated Screenshot Tool
 *
 * Uses playwright-core + system Microsoft Edge (no browser download).
 * Run via take-screenshots.ps1 — do not run this file directly.
 */

import { chromium } from 'playwright-core';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR  = join(__dirname, '..', 'screenshots');
const BASE_URL    = 'http://localhost:3001';
const EMAIL       = 'superadmin@gsshospital.com';
const PASSWORD    = 'password123';
const VIEWPORT    = { width: 1440, height: 900 };

mkdirSync(OUTPUT_DIR, { recursive: true });

/** Pages to screenshot — order matters for the numbered filenames */
const PAGES = [
  { file: '01-login.png',           path: '/login',       auth: false },
  { file: '02-dashboard.png',       path: '/dashboard',   auth: true  },
  { file: '03-staff-directory.png', path: '/staff',       auth: true  },
  { file: '04-attendance.png',      path: '/attendance',  auth: true  },
  { file: '05-leave-management.png',path: '/leave',       auth: true  },
  { file: '06-payroll.png',         path: '/payroll',     auth: true  },
  { file: '07-licenses.png',        path: '/licenses',    auth: true  },
  { file: '08-user-management.png', path: '/users',       auth: true  },
  { file: '09-settings.png',        path: '/settings',    auth: true  },
];

// ─── Wait for server ──────────────────────────────────────────────────────────
async function waitForServer(maxAttempts = 45) {
  process.stdout.write('Waiting for server');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/settings/mode`);
      if (res.status < 500) {
        process.stdout.write(' ready.\n');
        return;
      }
    } catch { /* not up yet */ }
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server did not become ready within 45 seconds.');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  await waitForServer();

  // Launch system Edge — no browser download required
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--disable-features=TranslateUI', '--lang=en-US'],
  });

  const context = await browser.newContext({ viewport: VIEWPORT });
  const page    = await context.newPage();

  // Suppress browser console noise
  page.on('console', () => {});

  // ── 1. Login page (unauthenticated) ─────────────────────────────────────────
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: join(OUTPUT_DIR, '01-login.png') });
  console.log('  [OK] 01-login.png');

  // ── 2. Log in as Super Admin ─────────────────────────────────────────────────
  await page.fill('input[type="email"]',    EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200); // let charts/animations settle

  // ── 3. Screenshot each authenticated page ────────────────────────────────────
  for (const { file, path } of PAGES.filter(p => p.auth)) {
    try {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(700); // let lazy data load
      await page.screenshot({ path: join(OUTPUT_DIR, file) });
      console.log(`  [OK] ${file}`);
    } catch (err) {
      console.error(`  [FAIL] ${file}: ${err.message}`);
    }
  }

  await browser.close();

  console.log('');
  console.log(`  Saved ${PAGES.length} screenshots -> screenshots\\`);
})();
