const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log("Navigating to Vercel...");
  await page.goto("https://almothfin-seven.vercel.app/", { waitUntil: 'networkidle0' });
  
  console.log("Page loaded");
  await browser.close();
})();
