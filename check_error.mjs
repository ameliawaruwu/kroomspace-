import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // click the first project card
  await page.evaluate(() => {
    const projectTitles = Array.from(document.querySelectorAll('h3'));
    if (projectTitles.length > 0) {
      projectTitles[0].click();
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT AFTER CLICK:', bodyText.substring(0, 500));
  
  await browser.close();
})();
