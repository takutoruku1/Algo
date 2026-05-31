// 録画用スクリプト（開発時のみ使用）。Playwright でゲームを操作し動画を保存する。
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'media');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    recordVideo: { dir: outDir, size: { width: 800, height: 600 } },
  });
  const page = await context.newPage();
  page.on('console', (m) => console.log('PAGE:', m.text()));
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

  await page.goto('file://' + path.join(root, 'index.html'));
  // Phaser 起動とシーン生成を待つ
  await page.waitForTimeout(1500);
  await page.mouse.click(400, 300);

  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(ms);
    await page.keyboard.up(key);
  };

  // いろんな方向に歩かせる → アクション
  await hold('ArrowRight', 900);
  await hold('ArrowDown', 700);
  await hold('ArrowLeft', 900);
  await hold('ArrowUp', 700);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(300);
  await page.keyboard.press('Space');
  await page.waitForTimeout(900);
  await hold('ArrowLeft', 800);

  const video = page.video();
  await context.close(); // 動画はここで確定保存される
  await browser.close();

  const src = await video.path();
  const dest = path.join(outDir, 'demo.webm');
  fs.renameSync(src, dest);
  console.log('SAVED:', dest);
})();
