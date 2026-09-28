import { atom } from 'nanostores';
import * as THREE from 'three';

export type GameState = 'playing' | 'gameover' | 'viewing_project';

export const playerHealth = atom<number>(100);
export const gameState = atom<GameState>('playing');
export const playerPosition = atom<{ x: number, y: number, z: number }>({ x: 0, y: 0, z: 0 });

export const activeProject = atom<{ title: string, description: string, position?: THREE.Vector3 } | null>(null);

export function takeDamage(amount: number) {
  const currentHealth = playerHealth.get();
  const newHealth = currentHealth - amount;
  playerHealth.set(newHealth);
  
  if (newHealth <= 0) {
    gameState.set('gameover');
  }
}

export function updatePlayerPosition(x: number, y: number, z: number) {
  playerPosition.set({ x, y, z });
}

export function openProject(title: string, description: string, position?: THREE.Vector3) {
  activeProject.set({ title, description, position });
  gameState.set('viewing_project');
}

export function closeProject() {
  activeProject.set(null);
  gameState.set('playing');
}
