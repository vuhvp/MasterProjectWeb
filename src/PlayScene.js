import Phaser from 'phaser';

class PlayScene extends Phaser.Scene {

  constructor() {
    super('PlayScene');
  }

  create() {
    this.GAME_SPPED_SCALE_INCREASE = 0.000001
    this.SPAWN_INTERVAL_MIN = 1000
    this.SPAWN_INTERVAL_MAX = 2000

    this.isGameRunning = false
    this.gameSpeed = 10
    this.respawnTime = 1000
    this.score = 0
    this.isGameOver = false
    this.nextSpawnTime = this.SPAWN_INTERVAL_MIN

    const { height, width } = this.game.config

    this.startTrigger = this.physics.add.sprite(0, 10).setOrigin(0, 1).setImmovable()
    this.ground = this.add.tileSprite(0, height, 88, 26, 'ground').setOrigin(0, 1)
    this.scoreText = this.add.text(width, 0, '00000', { fill: "#535353", font: '900 35px Courier', resolution: 5 }).setOrigin(1, 0)
    this.highScoreText = this.add.text(width, 0, '00000', { fill: "#535353", font: '900 35px Courier', resolution: 5 }).setOrigin(1, 0).setAlpha(0)
    this.dino = this.physics.add.sprite(0, height, 'dino-idle')
      .setOrigin(0, 1)
      .setDepth(1)
      .setCollideWorldBounds(true)
      .setGravityY(5000)


    this.dino.setBodySize(44, 92)

    this.gameOverScreen = this.add.container(width / 2, height / 2).setAlpha(0)
    this.gameOverText = this.add.image(0, 0, 'game-over')
    this.restart = this.add.image(0, 80, 'restart').setAlpha(0)
    this.gameOverScreen.add([
      this.gameOverText, this.restart
    ]).setDepth(1)
    this.obstacles = this.physics.add.group()

    this.initAnimations()
    this.initColliders()
    this.initStartTrigger()
    this.handleInputs()
    this.handleScore()
  }

  handleInputs() {
    this.input.keyboard.on('keydown', (event) => {
      if (event.keyCode === 32) {
        if (this.dino.body.onFloor()) {
          this.dino.setVelocityY(-1600)
        }
        if (this.restart.alpha === 1) {
          this.dino.setVelocityY(0)
          this.physics.resume()
          this.obstacles.clear(true, true)
          this.isGameRunning = true
          this.gameOverScreen.setAlpha(0)
          this.anims.resumeAll()
          this.restart.setAlpha(0)
        }
      }
    })
  }

  initStartTrigger() {
    const { width, height } = this.game.config
    this.physics.add.overlap(this.startTrigger, this.dino, () => {
      if (this.startTrigger.y == 10) {
        this.startTrigger.body.reset(0, height)
        return
      }
      this.startTrigger.disableBody(true, true)
      const startEvent = this.time.addEvent({
        delay: 1000 / 60,
        loop: true,
        callbackScope: this,
        callback: () => {
          this.dino.play('dino-run', 1)
          this.dino.setVelocityX(70)

          if (this.ground.width < width) {
            this.ground.width += 18 * 2
          }

          if (this.ground.width >= width) {
            this.ground.width = width
            this.isGameRunning = true
            this.dino.setVelocity(0)
            startEvent.remove()
          }
        }
      })
    }, null, this)
  }

  handleScore() {
    this.time.addEvent({
      delay: 1000 / 10,
      loop: true,
      callbackScope: this,
      callback: () => {
        if (!this.isGameRunning) return
        this.score++
        const score = Array.from(String(this.score), Number)
        for (let i = 0; i < 5 - String(this.score).length; i++) {
          score.unshift(0)
        }
        this.scoreText.setText(score.join(''))
      }
    })
  }

  initColliders() {
    this.physics.add.collider(this.dino, this.obstacles, () => {
      this.highScoreText.x = this.scoreText.x - this.scoreText.width - 20;

      const highScore = this.highScoreText.text.substr(this.highScoreText.text.length - 5);
      const newScore = Number(this.scoreText.text) > Number(highScore) ? this.scoreText.text : highScore;

      this.highScoreText.setText('HI ' + newScore);
      this.highScoreText.setAlpha(1);

      this.physics.pause()
      this.isGameRunning = false
      this.anims.pauseAll()
      this.dino.setTexture('dino-hurt');
      this.respawnTime = 0
      this.gameSpeed = 10
      this.gameOverScreen.setAlpha(1)
      this.score = 0
      this.spawnTime = 700
      setTimeout(() => {
        this.restart.setAlpha(1)
      }, 500);
    }, null, this)
  }

  placeObstacle() {
    const { width, height } = this.game.config
    const obstacleNum = Math.floor(Math.random() * 8) + 1

    let obstacle
    if (obstacleNum > 6) {
      obstacle = this.obstacles.create(width, height - 20, `enemy-bird`)
      obstacle.play('dino-fly', 1);
      obstacle.body.height = obstacle.body.height / 1.5;
      obstacle.body.offset.y = +30
    } else {
      obstacle = this.obstacles.create(width, height, `obstacle-${obstacleNum}`)
      obstacle.setBodySize(obstacle.width - obstacle.width / 10, obstacle.height)
      obstacle.body.offset.y = +10
    }
    obstacle.setOrigin(0, 1).setImmovable()
  }

  initAnimations() {
    this.anims.create({
      key: 'dino-run',
      frames: this.anims.generateFrameNumbers('dino', { start: 2, end: 3 }),
      frameRate: this.gameSpeed,
      repeat: -1
    })

    this.anims.create({
      key: 'dino-fly',
      frames: this.anims.generateFrameNumbers('enemy-bird', { start: 0, end: 1 }),
      frameRate: 6,
      repeat: -1
    })
  }

  updateGround(increasement) {
    this.ground.tilePositionX += increasement
  }

  updateObstacle(delta, increasement) {
    Phaser.Actions.IncX(this.obstacles.getChildren(), increasement * -1)

    this.obstacles.getChildren().forEach(obstacle => {
      if (obstacle.getBounds().right < 0) {
        obstacle.destroy()
      }
    })

    if (this.nextSpawnTime <= 0) {
      this.placeObstacle()
      this.nextSpawnTime = this.randomNumber(this.SPAWN_INTERVAL_MIN, this.SPAWN_INTERVAL_MAX) / (this.gameSpeed / 10)
    }
    this.nextSpawnTime -= delta
  }

  updatePlayer() {
    if (!this.dino.body.onFloor()) {
      this.dino.anims.stop()
      this.dino.setTexture('dino')
    }
    else {
      this.dino.play('dino-run', true)
    }
  }

  updateGameSpeed(delta) {
    this.gameSpeed += delta * this.GAME_SPPED_SCALE_INCREASE
  }

  update(time, delta) {
    if (!this.isGameRunning) return
    const increasement = this.gameSpeed * delta * 0.05
    this.updateGround(increasement)
    this.updateObstacle(delta, increasement)
    this.updatePlayer()
    this.updateGameSpeed(delta)
  }

  randomNumber(min, max) {
    return Math.floor((Math.random()) * (max - min + 1)) + min
  }
}

export default PlayScene;
