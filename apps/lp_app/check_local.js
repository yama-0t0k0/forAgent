const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  
  const captureUrl = async (url, file) => {
    console.log(`Navigating to ${url} ...`);
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: file });
    await page.close();
  };

  await captureUrl('http://127.0.0.1:5002/lp/PrivacyPolicy', 'privacy_local.png');
  await captureUrl('http://127.0.0.1:5002/lp/PasskeyLogin', 'passkey_local.png');
  
  await browser.close();
})();
