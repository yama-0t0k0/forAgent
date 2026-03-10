const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

  console.log('Navigating to Home...');
  await page.goto('https://admin-app-site-d11f0.web.app/lp', { waitUntil: 'networkidle0' });
  
  console.log('Clicking "ログイン" button...');
  // Find the button inside header (testID="login-button")
  const buttonSelector = '[data-testid="login-button"]'; 
  // Because it's react-native-web, testID maps to data-testid usually
  
  try {
    const isLoginBtnFound = await page.$(buttonSelector);
    if (isLoginBtnFound) {
      await page.click(buttonSelector);
      console.log('Button clicked. Waiting...');
      await new Promise(r => setTimeout(r, 2000));
      const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
      console.log(`Root length after click:`, rootHtml?.length);
    } else {
      console.log('Could not find login button via testid. Trying text...');
      const [button] = await page.$x("//div[contains(., 'ログイン')]");
      if (button) {
          await button.click();
          await new Promise(r => setTimeout(r, 2000));
          const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML);
          console.log(`Root length after click:`, rootHtml?.length);
      }
    }
  } catch (e) {
    console.error('Click error:', e);
  }

  await browser.close();
})();
