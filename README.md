# Algo — キャラクターを動かすデモ (Phaser.js)

スプライトシートのキャラクターを、矢印キー / WASD で動かせるブラウザ向けデモです。
画像ファイルがまだ無くても、自動生成される「仮スプライト」でそのまま動きます。

## 操作方法

| キー | 動作 |
| --- | --- |
| ↑ ↓ ← → / W A S D | 移動（歩行アニメ） |
| Space | アクション（1 回再生） |

## 動かし方

ブラウザのセキュリティ上、ローカルファイルを直接開くより簡易サーバ経由が確実です。

```bash
# このフォルダで
npx serve .
#   → 表示された http://localhost:3000 などをブラウザで開く

# もしくは Python でも可
python3 -m http.server 8000
#   → http://localhost:8000 を開く
```

> `index.html` をダブルクリックで直接開いても、仮スプライトなら多くのブラウザで
> 動きます。本物の画像を使うときはサーバ経由を推奨します。

## 本物のキャラ画像に差し替える

1. スプライトシートを `assets/character.png` として保存
2. `src/config.js` の `columns` / `rows` / `frameWidth` / `frameHeight` を実寸に合わせる
3. `ANIMATIONS` の各 `frames`（フレーム番号）を画像に合わせて調整

詳細は [`assets/README.md`](assets/README.md) を参照。

## ファイル構成

```
index.html              画面とライブラリ読み込み
src/
  config.js             スプライト/アニメ設定（主にここを編集）
  main.js               Phaser 起動設定
  scenes/PlayScene.js   移動・アニメ・仮スプライト生成のロジック
assets/                 画像置き場（character.png をここに）
```

※ Phaser 本体は `vendor/phaser.min.js` に同梱しているため、オフラインでも動きます。
