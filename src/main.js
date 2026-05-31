/*
 * main.js
 * Phaser ゲーム全体の設定と起動。
 */

const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#2d2d44',
  pixelArt: true, // ドット絵をくっきり表示
  scene: [PlayScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// eslint-disable-next-line no-new
new Phaser.Game(gameConfig);
