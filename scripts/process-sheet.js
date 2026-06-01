/*
 * process-sheet.js
 * --------------------------------------------------------------------------
 * 緑背景(クロマキー)のスプライトシートを透過PNGに変換するスクリプト。
 *
 * 使い方:
 *   1. 元画像を assets/character_raw.png として保存
 *   2. node scripts/process-sheet.js
 *   3. assets/character.png (透過済み) が生成される
 *      + 画像サイズから割り出した frameWidth/frameHeight が表示される
 *
 * config.js の columns / rows を実際のコマ数に合わせておくと、
 * 推奨フレームサイズも正しく計算されます。
 * --------------------------------------------------------------------------
 */
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'assets', 'character_raw.png');
const OUTPUT = path.join(ROOT, 'assets', 'character.png');

// クロマキー判定: 緑が際立っているピクセルを背景とみなす
function isGreenScreen(r, g, b) {
  return g > 90 && g > r * 1.35 && g > b * 1.35;
}

(async () => {
  if (!fs.existsSync(INPUT)) {
    console.error(`元画像が見つかりません: ${INPUT}`);
    console.error('スプライトシートを assets/character_raw.png として保存してください。');
    process.exit(1);
  }

  const img = await Jimp.read(INPUT);
  const { width, height } = img.bitmap;

  let removed = 0;
  img.scan(0, 0, width, height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];

    if (isGreenScreen(r, g, b)) {
      this.bitmap.data[idx + 3] = 0; // 透明に
      removed++;
    } else if (g > (r + b) / 2) {
      // 縁に残る緑かぶり(green spill)を軽く抑える
      this.bitmap.data[idx + 1] = Math.round((r + b) / 2);
    }
  });

  await img.write(OUTPUT);

  // config.js から columns/rows を読み取って推奨フレームサイズを表示
  let cols = 4;
  let rows = 5;
  try {
    const cfg = fs.readFileSync(path.join(ROOT, 'src', 'config.js'), 'utf8');
    cols = Number((cfg.match(/columns:\s*(\d+)/) || [])[1]) || cols;
    rows = Number((cfg.match(/rows:\s*(\d+)/) || [])[1]) || rows;
  } catch (_) {}

  console.log('--- 変換完了 ---');
  console.log(`入力 : ${INPUT}`);
  console.log(`出力 : ${OUTPUT}`);
  console.log(`画像サイズ : ${width} x ${height}`);
  console.log(`透過にしたピクセル数 : ${removed}`);
  console.log(`config.js の columns=${cols}, rows=${rows} を前提とした推奨値:`);
  console.log(`  frameWidth : ${Math.round(width / cols)}  (= ${width} / ${cols})`);
  console.log(`  frameHeight: ${Math.round(height / rows)}  (= ${height} / ${rows})`);
  if (width % cols !== 0 || height % rows !== 0) {
    console.log('  ※ 割り切れていません。columns/rows が実際のコマ数と合っているか確認してください。');
  }
})();
