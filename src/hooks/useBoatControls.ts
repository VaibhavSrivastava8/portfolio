import { useEffect, useState } from 'react';

export function useBoatControls() {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setControls((c) => ({ ...c, forward: true }));
          break;
        case 'ArrowDown':
        case 'KeyS':
          setControls((c) => ({ ...c, backward: true }));
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setControls((c) => ({ ...c, left: true }));
          break;
        case 'ArrowRight':
        case 'KeyD':
          setControls((c) => ({ ...c, right: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setControls((c) => ({ ...c, forward: false }));
          break;
        case 'ArrowDown':
        case 'KeyS':
          setControls((c) => ({ ...c, backward: false }));
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setControls((c) => ({ ...c, left: false }));
          break;
        case 'ArrowRight':
        case 'KeyD':
          setControls((c) => ({ ...c, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return controls;
}
