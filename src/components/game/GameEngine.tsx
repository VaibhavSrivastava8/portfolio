import { useEffect } from 'react';
import { Game } from '../../folio-engine/Game.js';

export default function GameEngine() {
  useEffect(() => {
    // The engine expects to find .game and .js-canvas in the DOM, 
    // which are now natively provided by index.astro's HTML structure.
    
    // We wrap initialization in a small timeout to ensure the DOM is fully parsed
    // and styles are applied before the canvas size is calculated.
    const timer = setTimeout(() => {
      const game = new Game();
      ;(window as any).game = game
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
