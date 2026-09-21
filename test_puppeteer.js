import puppeteer from 'puppeteer';

async function testPuppeteer() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  const url = 'https://www.google.com/maps/search/?api=1&query_place_id=ChIJ5ZCDtsDzzZURo3JM_IxuSRo&query=3C+Biog%C3%A1s+S.A.';
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Wait for the URL to change to the place URL
    await page.waitForFunction('window.location.href.includes("@")', { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    const match = currentUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      console.log('Coordinates:', match[1], match[2]);
    } else {
      console.log('No coordinates in URL');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

testPuppeteer();
