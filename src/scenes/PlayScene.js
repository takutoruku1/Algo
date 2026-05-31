/*
 * PlayScene.js
 * --------------------------------------------------------------------------
 * キャラクターを矢印キー / WASD で動かすメインシーン。
 *  - assets/character.png があればそれを使う
 *  - 無ければ実行時に「仮スプライト」を生成して、とりあえず動く
 * --------------------------------------------------------------------------
 */

class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.usingPlaceholder = false;
  }

  preload() {
    const c = SPRITE_CONFIG;

    // 画像の読み込みに失敗（ファイルが無い等）したら仮スプライトに切り替える
    this.load.on('loaderror', (file) => {
      if (file.key === c.key) {
        this.usingPlaceholder = true;
      }
    });

    this.load.spritesheet(c.key, c.path, {
      frameWidth: c.frameWidth,
      frameHeight: c.frameHeight,
    });
  }

  create() {
    const c = SPRITE_CONFIG;

    // 画像が読めなかった場合は、同じコマ割りの仮テクスチャを作る
    if (this.usingPlaceholder || !this.textures.exists(c.key)) {
      this.createPlaceholderSheet();
    }

    this.createAnimations();

    // 画面中央にキャラを配置
    this.hero = this.add.sprite(
      this.scale.width / 2,
      this.scale.height / 2,
      c.key
    );
    this.hero.setScale(c.displayScale);
    this.hero.play('idle');

    // 入力（矢印キー + WASD + スペース）
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    this.isActing = false;

    // 仮スプライト使用中だと一目で分かるように注記を出す
    if (this.usingPlaceholder) {
      this.add
        .text(
          this.scale.width / 2,
          16,
          '仮スプライトで動作中（assets/character.png を置くと差し替わります）',
          { fontSize: '14px', color: '#ffd166', fontFamily: 'sans-serif' }
        )
        .setOrigin(0.5, 0);
    }
  }

  update() {
    if (!this.hero) return;

    const speed = MOVE_SPEED * (this.game.loop.delta / 1000);
    let dx = 0;
    let dy = 0;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left) dx -= 1;
    if (right) dx += 1;
    if (up) dy -= 1;
    if (down) dy += 1;

    // スペースでアクション再生（再生中は移動を止める）
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && !this.isActing) {
      this.isActing = true;
      this.hero.play('action');
      this.hero.once('animationcomplete', () => {
        this.isActing = false;
        this.hero.play('idle');
      });
      return;
    }
    if (this.isActing) return;

    if (dx !== 0 || dy !== 0) {
      // 斜め移動でも速さが一定になるよう正規化
      const len = Math.hypot(dx, dy);
      this.hero.x += (dx / len) * speed;
      this.hero.y += (dy / len) * speed;

      // 進行方向に向きを反転（左向きのとき左右反転）
      if (dx < 0) this.hero.setFlipX(true);
      else if (dx > 0) this.hero.setFlipX(false);

      if (this.hero.anims.currentAnim?.key !== 'walk') {
        this.hero.play('walk');
      }
    } else {
      if (this.hero.anims.currentAnim?.key !== 'idle') {
        this.hero.play('idle');
      }
    }

    // 画面の外に出ないよう制限
    const halfW = (SPRITE_CONFIG.frameWidth * SPRITE_CONFIG.displayScale) / 2;
    const halfH = (SPRITE_CONFIG.frameHeight * SPRITE_CONFIG.displayScale) / 2;
    this.hero.x = Phaser.Math.Clamp(this.hero.x, halfW, this.scale.width - halfW);
    this.hero.y = Phaser.Math.Clamp(this.hero.y, halfH, this.scale.height - halfH);
  }

  createAnimations() {
    const c = SPRITE_CONFIG;
    for (const [name, def] of Object.entries(ANIMATIONS)) {
      if (this.anims.exists(name)) continue;
      this.anims.create({
        key: name,
        frames: def.frames.map((index) => ({ key: c.key, frame: index })),
        frameRate: def.frameRate,
        repeat: def.repeat,
      });
    }
  }

  // 画像が無いとき用：Canvas で同じコマ割りの仮シートを作る
  createPlaceholderSheet() {
    const c = SPRITE_CONFIG;
    const fw = c.frameWidth;
    const fh = c.frameHeight;
    const total = c.columns * c.rows;

    const tex = this.textures.createCanvas(c.key, fw * c.columns, fh * c.rows);
    const ctx = tex.getContext();

    for (let i = 0; i < total; i++) {
      const col = i % c.columns;
      const row = Math.floor(i / c.columns);
      const x = col * fw;
      const y = row * fh;

      // 背景：行ごとに少し色を変える
      const hue = (row * 60) % 360;
      ctx.fillStyle = `hsl(${hue}, 45%, 35%)`;
      ctx.fillRect(x, y, fw, fh);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.strokeRect(x + 1, y + 1, fw - 2, fh - 2);

      // 簡単な人型（頭＋体）。歩きコマ(12-19)は少し脚を振る
      const cx = x + fw / 2;
      const headR = Math.min(fw, fh) * 0.14;
      const headY = y + fh * 0.32;

      ctx.fillStyle = '#f2f2f7';
      ctx.beginPath();
      ctx.arc(cx, headY, headR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cfcfe6';
      ctx.fillRect(cx - fw * 0.12, headY + headR, fw * 0.24, fh * 0.28);

      // 脚（フレーム番号で開き具合を変えてアニメっぽく）
      const swing = ((i % 4) - 1.5) * fw * 0.05;
      ctx.strokeStyle = '#9a9ac0';
      ctx.lineWidth = Math.max(2, fw * 0.03);
      const legTop = headY + headR + fh * 0.28;
      const legBottom = legTop + fh * 0.18;
      ctx.beginPath();
      ctx.moveTo(cx, legTop);
      ctx.lineTo(cx - fw * 0.06 + swing, legBottom);
      ctx.moveTo(cx, legTop);
      ctx.lineTo(cx + fw * 0.06 - swing, legBottom);
      ctx.stroke();

      // フレーム番号
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(fh * 0.12)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(String(i), x + 6, y + 6);
    }

    tex.refresh();

    // スプライトシートとしてフレームを登録
    for (let i = 0; i < total; i++) {
      const col = i % c.columns;
      const row = Math.floor(i / c.columns);
      tex.add(i, 0, col * fw, row * fh, fw, fh);
    }
  }
}
