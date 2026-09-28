export function calculateGerstnerWave(
  x: number, 
  z: number, 
  time: number
): number {
  // Wave parameters (must match the shader exactly)
  const waves = [
    { dir: { x: 1.0, y: 0.5 }, steepness: 0.1, wavelength: 10.0, speed: 0.5 },
    { dir: { x: 0.5, y: 1.0 }, steepness: 0.1, wavelength: 8.0, speed: 0.6 },
    { dir: { x: -0.2, y: 0.8 }, steepness: 0.05, wavelength: 5.0, speed: 0.8 },
  ];

  let yOffset = 0;

  for (const wave of waves) {
    const k = (2.0 * Math.PI) / wave.wavelength;
    const c = Math.sqrt(9.8 / k);
    const f = k * (wave.dir.x * x + wave.dir.y * z - c * time * wave.speed);
    const a = wave.steepness / k;
    yOffset += a * Math.sin(f);
  }

  // The ocean plane is at y = -0.5
  return yOffset - 0.5;
}
