import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private crosshair!: Phaser.GameObjects.Image;
  private enemies: Phaser.GameObjects.Group;
  private healthBar!: Phaser.GameObjects.Graphics;
  private playerHealth = 100;
  private gameOver = false;

  private level = 1;
  private obstacles = 7;
  private levelText!: Phaser.GameObjects.Text;

  private weaponText!: Phaser.GameObjects.Text;
  private currentWeapon = 'sniper'; // sniper, short_range, bomb

  constructor() {
    super('GameScene');
  }

  preload() {
    // Load assets
    this.load.image('player', 'https://via.placeholder.com/50x50/0000FF/FFFFFF?text=Player');
    this.load.image('enemy', 'https://via.placeholder.com/50x50/FF0000/FFFFFF?text=Enemy');
    this.load.image('crosshair', 'https://via.placeholder.com/20x20/FFFFFF/000000?text=+');
    this.load.image('bullet', 'https://via.placeholder.com/10x5/FFFF00');
  }

  create() {
    // Player
    this.player = this.physics.add.sprite(100, 300, 'player');

    // Enemies
    this.enemies = this.add.group();
    for (let i = 0; i < 5; i++) {
      const enemy = this.physics.add.sprite(Phaser.Math.Between(400, 1100), Phaser.Math.Between(100, 500), 'enemy');
      this.enemies.add(enemy);
    }

    // Crosshair
    this.crosshair = this.add.image(this.game.config.width as number / 2, this.game.config.height as number / 2, 'crosshair').setDepth(10);
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        this.crosshair.setPosition(pointer.x, pointer.y);
    });

    // Controls
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.shoot(pointer.x, pointer.y);
    });
    
    // Hide default cursor
    this.input.setDefaultCursor('none');

    // UI Elements
    this.createUI();

    this.physics.add.collider(this.player, this.enemies, (player, enemy) => {
        this.playerHit(enemy as Phaser.Physics.Arcade.Sprite);
    });
  }

  createUI() {
    // Health Bar
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    this.add.text(10, 10, 'Player Health:', { fontSize: '16px', color: '#fff' });

    // Level Info
    this.levelText = this.add.text(10, 50, `Level: ${this.level} / 10 | Obstacles: ${this.obstacles}`, { fontSize: '16px', color: '#fff' });

    // Weapon Info
    this.weaponText = this.add.text(this.game.config.width as number - 250, 10, '', { fontSize: '16px', color: '#fff', align: 'right' }).setOrigin(1, 0);
    this.updateWeaponText();

    // Weapon switching keys (1, 2, 3)
    this.input.keyboard.on('keydown-ONE', () => { this.currentWeapon = 'sniper'; this.updateWeaponText(); });
    this.input.keyboard.on('keydown-TWO', () => { this.currentWeapon = 'short_range'; this.updateWeaponText(); });
    this.input.keyboard.on('keydown-THREE', () => { this.currentWeapon = 'bomb'; this.updateWeaponText(); });
  }

  updateHealthBar() {
    this.healthBar.clear();
    this.healthBar.fillStyle(0x00ff00, 1);
    this.healthBar.fillRect(130, 10, this.playerHealth * 2, 20);
  }

  updateWeaponText() {
      let weaponName = '';
      let range = '';
      switch(this.currentWeapon) {
          case 'sniper':
              weaponName = 'Sniper Rifle';
              range = '0-1100m';
              break;
          case 'short_range':
              weaponName = 'Short-Range Gun';
              range = '25-50m';
              break;
          case 'bomb':
              weaponName = 'Bomb/Bayonet';
              range = '0-25m';
              break;
      }
      this.weaponText.setText(`Weapon: ${weaponName}\nRange: ${range}\n(Keys 1, 2, 3 to switch)`);
  }

  shoot(x: number, y: number) {
    if (this.gameOver) return;

    const bullet = this.physics.add.image(this.player.x, this.player.y, 'bullet');
    this.physics.moveTo(bullet, x, y, 1000);

    this.physics.add.overlap(bullet, this.enemies, (bulletHit, enemyHit) => {
        enemyHit.destroy();
        bulletHit.destroy();
        // You could decrease obstacle count here
        this.obstacles = Math.max(0, this.obstacles - 1);
        this.levelText.setText(`Level: ${this.level} / 10 | Obstacles: ${this.obstacles}`);
        if (this.obstacles === 0) {
            this.levelUp();
        }
    });
  }

  update() {
    if (this.gameOver) return;

    this.enemies.getChildren().forEach(enemy => {
        this.physics.moveToObject(enemy, this.player, 50); // Enemies move towards player
    });
  }

  playerHit(enemy: Phaser.Physics.Arcade.Sprite) {
      if(this.gameOver) return;

      this.playerHealth -= 20;
      this.updateHealthBar();
      enemy.destroy();
      this.obstacles = Math.max(0, this.obstacles - 1);
      this.levelText.setText(`Level: ${this.level} / 10 | Obstacles: ${this.obstacles}`);

      if (this.playerHealth <= 0) {
          this.endGame(false);
      }
  }

  levelUp() {
      this.level++;
      if (this.level > 10) {
          this.endGame(true);
          return;
      }
      this.obstacles = 7;
      this.levelText.setText(`Level: ${this.level} / 10 | Obstacles: ${this.obstacles}`);
      
      // Respawn enemies
      for (let i = 0; i < 5; i++) {
        const enemy = this.physics.add.sprite(Phaser.Math.Between(400, 1100), Phaser.Math.Between(100, 500), 'enemy');
        this.enemies.add(enemy);
      }
  }

  endGame(isWin: boolean) {
      this.gameOver = true;
      this.physics.pause();
      this.input.setDefaultCursor("default");
      this.crosshair.setVisible(false);

      let message = isWin ? 'You Win! Congratulations!' : 'Game Over';
      const endText = this.add.text(this.game.config.width as number / 2, this.game.config.height as number / 2 - 50, message, { fontSize: '64px', color: isWin ? '#00ff00' : '#ff0000' }).setOrigin(0.5);
      
      const restartButton = this.add.text(this.game.config.width as number / 2, this.game.config.height as number / 2 + 50, 'Restart Game', {
        fontSize: '32px',
        color: '#fff',
        backgroundColor: '#333',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive();

      restartButton.on('pointerdown', () => this.restartGame());
  }

  restartGame() {
      this.gameOver = false;
      this.playerHealth = 100;
      this.level = 1;
      this.obstacles = 7;
      this.scene.restart();
  }
}
