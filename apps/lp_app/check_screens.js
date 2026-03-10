const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  
  const captureUrl = async (url, file) => {
    console.log(`Navigating to ${url} ...`);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.screenshot({ path: file });
    await page.close();
  };

  await captureUrl('https://admin-app-site-d11f0.web.app/lp/PrivacyPolicy', 'privacy.png');
  await captureUrl('https://admin-app-site-d11f0.web.app/lp/PasskeyLogin', 'passkey.png');
  await captureUrl('https://admin-app-site-d11f0.web.app/lp/Login', 'login.png');
  await captureUrl('https://admin-app-site-d11f0.web.app/lp/', 'home.png');
  
  await browser.close();
})();
