import Phaser from 'phaser'

import PlayScene from './PlayScene';
import PreloadScene from './PreloadScene';

const config = {
  parent: 'jumping-dino',
  type: Phaser.AUTO,
  width: 1200,
  height: 340,
  pixelArt: true,
  transparent: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
},
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  // fps: {
  //   target: 120,
  //   forceSetTimeOut: true
  // },
  scene: [PreloadScene, PlayScene]
};

new Phaser.Game(config);