import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../game';

const Game = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) {
      return;
    }

    gameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: 'game-container',
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="game-container" className="w-[1200px] h-[600px]" />;
};

export default Game;
