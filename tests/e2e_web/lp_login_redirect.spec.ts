import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

/**
 * TestCase 002: LP Login and Redirect Verification (All Roles)
 * LPアプリから各ロールでログインし、適切なアプリへリダイレクトされることを確認する。
 */
test.describe('LP Login and Redirect Verification', () => {
  const timestamp = process.env.PLAYWRIGHT_EVIDENCE_TIMESTAMP || new Date().toISOString().replace(/[:.]/g, '-');
  const evidenceDir = path.join(__dirname, '../../tests/evidence');

  // テストケース1: Admin (A999) -> Port 8081
  test('should redirect Admin user (A999) to Admin App', async ({ page }) => {
    await runLoginRedirectTest(page, {
      email: 'e2e-test-A999@lat-inc.com',
      password: 'E2ePassword2026!',
      targetUrl: 'http://localhost:8081',
      targetTestId: 'dashboard_screen',
      role: 'Admin'
    });
  });

  // テストケース2: Individual (C000000000001) -> Port 8082
  test('should redirect Individual user (C000000000001) to Individual App', async ({ page }) => {
    await runLoginRedirectTest(page, {
      email: 'e2e-test-C000000000001@lat-inc.com',
      password: 'E2ePassword2026!',
      targetUrl: 'http://localhost:8082',
      targetTestId: 'user_full_name',
      role: 'Individual'
    });
  });

  // テストケース3: Corporate (B00001) -> Port 8083
  test('should redirect Corporate user (B00001) to Corporate App', async ({ page }) => {
    await runLoginRedirectTest(page, {
      email: 'e2e-test-B00001@lat-inc.com',
      password: 'E2ePassword2026!',
      targetUrl: 'http://localhost:8083',
      targetTestId: 'company_detail_name',
      role: 'Corporate'
    });
  });

  async function runLoginRedirectTest(page: Page, config: { email: string, password: string, targetUrl: string, targetTestId: string, role: string }) {
    // コンソールログをターミナルに出力
    page.on('console', msg => console.log(`[Browser ${msg.type()}][${config.role}] ${msg.text()}`));

    console.log(`[${config.role}] Opening LP App...`);
    await page.goto('http://localhost:8087');
    
    await expect(page.getByTestId('logo-text')).toBeVisible({ timeout: 15000 });

    console.log(`[${config.role}] Navigating to Login...`);
    await page.getByTestId('login-button').click();
    await page.click('text=Password でのログインはこちら');

    console.log(`[${config.role}] Entering credentials for ${config.role}...`);
    await page.fill('input[placeholder="example@lat-inc.com"]', config.email);
    await page.fill('input[placeholder="••••••••"]', config.password);
    
    await page.screenshot({ path: path.join(evidenceDir, `lp_app_web_${timestamp}_${config.role}_input.png`) });

    await page.click('[data-testid="login-submit-button"]');

    console.log(`[${config.role}] Waiting for redirection to ${config.targetUrl}...`);
    // タイムアウトを長めに設定 (60s)
    await page.waitForURL(`${config.targetUrl}/**`, { timeout: 60000 });

    console.log(`[${config.role}] Redirection success. Current URL: ${page.url()}`);
    
    // レンダリング待機 (少し待ってからスクリーンショット)
    await page.waitForTimeout(5000);

    // エビデンス: 成功画面 (エラーが起きても必ず撮るために try-finally は使わずシンプルに)
    await page.screenshot({ path: path.join(evidenceDir, `lp_app_web_${timestamp}_${config.role}_success.png`), fullPage: true });

    // 最終確認
    expect(page.url()).toContain(config.targetUrl);
    console.log(`✅ [${config.role}] Redirection verified successfully!`);
  }
});
