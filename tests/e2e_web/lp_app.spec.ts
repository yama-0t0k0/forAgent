import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('LP App Golden Path (Web)', () => {
  test('should load the LP application and display Registration elements', async ({ page }, testInfo) => {
    // Navigate to the local Expo web server root
    await page.goto('/');

    // Wait for the app to actually mount (Expo Web usually puts everything in #root)
    await page.waitForSelector('#root', { state: 'attached' });

    // Look for registration-related text which indicates the LP home page has loaded
    // Playwright locator matching text ending in "登録" or similar CTA texts
    const registrationElement = page.getByText(/.*登録.*/).first();
    
    // Check if the element is visible with a timeout
    await expect(registrationElement).toBeVisible({ timeout: 15000 });

    // Ensure evidence directory exists
    const now = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    // Use the explicitly exported timestamp from bash to strictly sync with the log filename
    const dateStamp = process.env.PLAYWRIGHT_EVIDENCE_TIMESTAMP || (
      now.getFullYear().toString() + 
      pad(now.getMonth() + 1) + 
      pad(now.getDate()) + '_' + 
      pad(now.getHours()) + 
      pad(now.getMinutes()) + 
      pad(now.getSeconds())
    );
      
    const evidenceDir = path.join(process.cwd(), 'tests', 'evidence');
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    // Take screenshot of the successful launch
    const screenshotPath = path.join(evidenceDir, `lp_app_web_${dateStamp}_screen_final.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Attach to playwright report if needed
    await testInfo.attach('Final Screenshot', { path: screenshotPath, contentType: 'image/png' });

    // Basic visual assertion
    await expect(page.locator('body')).toBeVisible();
  });
});
