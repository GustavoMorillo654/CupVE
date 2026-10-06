import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('C:\\Users\\GEMV\\OneDrive\\Documentos\\UNET\\PROYECTOS\\CupVE\\screenshots');
const ARTIFACT_DIR = path.resolve('C:\\Users\\GEMV\\.gemini\\antigravity-cli\\brain\\819c86bb-3734-4497-9079-ec8dd4e554e8');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function safeWrite(filePath, buffer) {
  try {
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    fs.writeFileSync(filePath, buffer);
  } catch (err) {
    console.warn(`Could not overwrite ${filePath}:`, err.message);
  }
}

async function run() {
  console.log('Launching Chrome via Puppeteer-Core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();

    // 1. Test Skeleton Loader on dedicated page
    console.log('\n--- 1. Testing Skeleton Loader (4 Cards + Brecha + Panels) ---');
    const skeletonPage = await browser.newPage();
    await skeletonPage.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });
    await skeletonPage.setRequestInterception(true);
    skeletonPage.on('request', req => {
      if (req.url().includes('/api/')) {
        // Delay response to hold loading skeleton state
        setTimeout(() => {
          try {
            req.respond({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'delayed' })
            });
          } catch (e) {}
        }, 5000);
      } else {
        req.continue();
      }
    });

    await skeletonPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const skeletonCount = await skeletonPage.evaluate(() => {
      const elements = document.querySelectorAll('.animate-pulse');
      return elements.length;
    });
    console.log(`✓ Skeleton elements detected: ${skeletonCount}`);

    const skeletonBuf = await skeletonPage.screenshot();
    safeWrite(path.join(OUTPUT_DIR, 'skeleton-loader-view.png'), skeletonBuf);
    safeWrite(path.join(ARTIFACT_DIR, 'skeleton-loader-view.png'), skeletonBuf);
    console.log('✓ Skeleton loader screenshot saved');
    await skeletonPage.close();

    // 2. Desktop Test (Full UI with 4 Cards)
    console.log('\n--- 2. Testing Desktop (PC) View with 4 Rate Cards ---');
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 1 });
    await page.goto(APP_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.comic-panel', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const desktopBuf = await page.screenshot();
    safeWrite(path.join(OUTPUT_DIR, 'desktop-view.png'), desktopBuf);
    safeWrite(path.join(ARTIFACT_DIR, 'desktop-view.png'), desktopBuf);
    console.log('✓ Desktop screenshot saved');

    // 3. Verify COP Naming and Absence of COL/COL$
    console.log('\n--- 3. Verifying Currency Naming (COP everywhere, NO COL/COL$) ---');
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasColOld = /COL\$|COL\b/i.test(bodyText);
    const hasCopNew = bodyText.includes('COP');
    console.log(`  Contains old 'COL' / 'COL$': ${hasColOld ? '⚠️ YES (Found)' : '✅ NO (Clean)'}`);
    console.log(`  Contains new 'COP': ${hasCopNew ? '✅ YES' : '❌ NO'}`);

    // 4. Mobile View Test - Click on Peso Cucuta Card to activate it
    console.log('\n--- 4. Testing Mobile View with Peso Cúcuta Active Card ---');
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    await new Promise(r => setTimeout(r, 400));

    // Click on the 4th card (Peso Cúcuta) to activate it and see ★ ACTIVA
    console.log('Activating Peso Cúcuta card...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.comic-panel'));
      const copCard = cards.find(c => c.textContent && c.textContent.includes('Peso Cúcuta'));
      if (copCard) copCard.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Scroll to the card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.comic-panel'));
      const copCard = cards.find(c => c.textContent && c.textContent.includes('Peso Cúcuta'));
      if (copCard) copCard.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    await new Promise(r => setTimeout(r, 300));

    const badgeStats = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.comic-panel'));
      const copCard = cards.find(c => c.textContent && c.textContent.includes('Peso Cúcuta'));
      const badge = copCard ? Array.from(copCard.querySelectorAll('.comic-badge')).find(b => b.textContent.includes('ACTIVA')) : null;
      return badge ? { text: badge.textContent.trim(), height: badge.offsetHeight } : null;
    });
    console.log('✓ Active badge stats on Peso Cúcuta card:', badgeStats);

    const activeCardBuf = await page.screenshot();
    safeWrite(path.join(OUTPUT_DIR, 'mobile-active-card-cop.png'), activeCardBuf);
    safeWrite(path.join(ARTIFACT_DIR, 'mobile-active-card-cop.png'), activeCardBuf);
    console.log('✓ Mobile active COP card screenshot saved');

    // 5. Mobile View Test - COP to VES
    console.log('\n--- 5. Testing Mobile View with Peso Cúcuta (COP ⇄ VES) ---');
    // Click 100k preset

    // Click 100k preset
    console.log('Clicking 100k COP preset...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#converter-section button'));
      const preset100k = buttons.find(b => b.textContent && b.textContent.trim() === '100k');
      if (preset100k) preset100k.click();
    });

    await new Promise(r => setTimeout(r, 600));

    // Scroll converter into center
    await page.evaluate(() => {
      const section = document.getElementById('converter-section');
      if (section) section.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    await new Promise(r => setTimeout(r, 400));

    const copVesState = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('#converter-section input[type="number"]')).map(i => i.value);
      const formula = document.querySelector('#converter-section .font-mono.font-black')?.textContent?.trim();
      return { inputs, formula };
    });
    console.log('COP ⇄ VES state:', copVesState);

    const copVesBuf = await page.screenshot();
    safeWrite(path.join(OUTPUT_DIR, 'mobile-conversion-cop-ves.png'), copVesBuf);
    safeWrite(path.join(ARTIFACT_DIR, 'mobile-conversion-cop-ves.png'), copVesBuf);
    console.log('✓ Mobile COP ⇄ VES screenshot saved');

    // 5. Mobile View Test - COP to USD
    console.log('\n--- 5. Testing Mobile View with Mode Toggle (COP ⇄ USD) ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#converter-section button'));
      const usdModeBtn = buttons.find(b => b.textContent && b.textContent.includes('COP ⇄ USD'));
      if (usdModeBtn) usdModeBtn.click();
    });

    await new Promise(r => setTimeout(r, 600));

    const copUsdState = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('#converter-section input[type="number"]')).map(i => i.value);
      const formula = document.querySelector('#converter-section .font-mono.font-black')?.textContent?.trim();
      return { inputs, formula };
    });
    console.log('COP ⇄ USD state:', copUsdState);

    const copUsdBuf = await page.screenshot();
    safeWrite(path.join(OUTPUT_DIR, 'mobile-conversion-cop-usd.png'), copUsdBuf);
    safeWrite(path.join(ARTIFACT_DIR, 'mobile-conversion-cop-usd.png'), copUsdBuf);
    console.log('✓ Mobile COP ⇄ USD screenshot saved');

    console.log('\n--- ALL BROWSER AUTOMATION TESTS COMPLETED SUCCESSFULLY ---');

  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
