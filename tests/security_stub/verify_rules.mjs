import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.resolve(__dirname, '../screenshots');
const MAX_SCREENSHOTS = 10;
const HTML_FILE = `file://${path.resolve(__dirname, 'index.html')}`;

async function rotateScreenshots() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    return;
  }

  const files = fs.readdirSync(SCREENSHOT_DIR)
    .filter(f => f.startsWith('security_report_') && f.endsWith('.png'))
    .map(f => ({
      name: f,
      path: path.join(SCREENSHOT_DIR, f),
      mtime: fs.statSync(path.join(SCREENSHOT_DIR, f)).mtime
    }))
    .sort((a, b) => a.mtime - b.mtime);

  if (files.length >= MAX_SCREENSHOTS) {
    const toDelete = files.slice(0, files.length - MAX_SCREENSHOTS + 1);
    for (const file of toDelete) {
      console.log(`Deleting old screenshot: ${file.name}`);
      fs.unlinkSync(file.path);
    }
  }
}

async function runAudit() {
  console.log('🚀 Launching Security Audit Browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1000 }
  });
  const page = await context.newPage();

  try {
    console.log(`📂 Opening: ${HTML_FILE}`);
    await page.goto(HTML_FILE);

    // Wait for Firebase to initialize (stub log check)
    await page.waitForTimeout(2000);

    console.log('🛡️  Starting Full Security Audit...');
    await page.click('button:has-text("Run Full Audit")');

    // Wait for the audit to finish (checked via data attribute)
    console.log('⏳ Waiting for audit completion...');
    await page.waitForSelector('body[data-test-status="finished"]', { timeout: 30000 });

    // Rotate and save
    await rotateScreenshots();
    const timestamp = Date.now();
    const screenshotPath = path.join(SCREENSHOT_DIR, `security_report_${timestamp}.png`);
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Audit Complete! Screenshot saved to: ${screenshotPath}`);

  } catch (error) {
    console.error('❌ Audit Failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
