const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  
  const checkUrl = async (url) => {
    console.log(`\nNavigating to ${url} ...`);
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
    console.log(`Root length for ${url}:`, rootHtml?.length);
    await page.close();
  };

  await checkUrl('https://admin-app-site-d11f0.web.app/lp/PrivacyPolicy');
  await checkUrl('https://admin-app-site-d11f0.web.app/lp/PasskeyLogin');
  await checkUrl('https://admin-app-site-d11f0.web.app/lp/Login');
  
  await browser.close();
})();
