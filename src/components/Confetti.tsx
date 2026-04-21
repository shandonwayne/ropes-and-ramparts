import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  speedX: number;
  speedY: number;
  delay: number;
}

interface ConfettiProps {
  active: boolean;
  colors?: string[];
}

export default function Confetti({ active, colors = ['#FFBC2E', '#F57B35', '#E08FB5', '#A0BD92', '#E64C35', '#DBDAD0'] }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) {
      setParticles([]);
      return;
    }
    const newParticles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.8,
        speedX: -2 + Math.random() * 4,
        speedY: 2 + Math.random() * 4,
        delay: Math.random() * 1.5,
      });
    }
    setParticles(newParticles);
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            ['--speed-x' as any]: `${p.speedX}vw`,
            ['--speed-y' as any]: `${p.speedY}vh`,
            ['--rotation' as any]: `${p.rotation}deg`,
            ['--scale' as any]: p.scale,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}
