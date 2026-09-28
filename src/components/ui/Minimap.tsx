import { useStore } from '@nanostores/react';
import { playerPosition } from '../../stores/gameStore';

export default function Minimap() {
  const pos = useStore(playerPosition);
  
  // Bruno's terrain size is 192x192, spanning from -96 to 96 on X and Z.
  // Map this to a 0-100% scale for CSS positioning.
  const mapSize = 192;
  const xPercent = ((pos.x + (mapSize / 2)) / mapSize) * 100;
  const yPercent = ((pos.z + (mapSize / 2)) / mapSize) * 100;

  return (
    <div className="absolute top-8 right-8 w-48 h-48 bg-white/10 backdrop-blur-md border border-white/20 rounded-full overflow-hidden shadow-2xl pointer-events-none">
      {/* We can use the terrain.png as a stylized minimap background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: 'url(/textures/terrain.png)' }}
      />
      
      {/* Player Blip */}
      <div 
        className="absolute w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-white transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
        style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
      />
      
      {/* Compass/Grid overlay */}
      <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-bold mt-1">N</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-white/50 font-bold mb-1">S</div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-white/50 font-bold ml-1">W</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-white/50 font-bold mr-1">E</div>
    </div>
  );
}
