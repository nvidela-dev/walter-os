"use client";

import { useEffect, useState, useCallback } from "react";

interface WalterInstance {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export function WelcomeAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; delay: number }>>([]);
  const [walters, setWalters] = useState<WalterInstance[]>([]);
  const [showWalterBounce, setShowWalterBounce] = useState(false);

  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = "sine", delay = 0) => {
    setTimeout(() => {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch {
        // Audio not supported
      }
    }, delay);
  }, []);

  const playBounceSound = useCallback(() => {
    const freq = 200 + Math.random() * 400;
    playSound(freq, 0.1, "square", 0);
  }, [playSound]);

  const playChord = useCallback((frequencies: number[], duration: number, delay = 0) => {
    frequencies.forEach((freq, i) => {
      playSound(freq, duration, "sine", delay + i * 30);
    });
  }, [playSound]);

  // Animate bouncing WALTERs
  useEffect(() => {
    if (!showWalterBounce) return;

    // Spawn multiple WALTERs
    const initialWalters: WalterInstance[] = Array.from({ length: 7 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      scale: 0.5 + Math.random() * 1,
      rotation: Math.random() * 360,
      opacity: 1,
    }));
    setWalters(initialWalters);

    let frameCount = 0;
    const maxFrames = 300; // ~5 seconds at 60fps

    const animate = () => {
      frameCount++;
      const fadeProgress = Math.max(0, (frameCount - maxFrames * 0.6) / (maxFrames * 0.4));

      setWalters(prev => prev.map(w => {
        let newX = w.x + w.vx;
        let newY = w.y + w.vy;
        let newVx = w.vx;
        let newVy = w.vy;

        // Bounce off walls
        if (newX < 5 || newX > 95) {
          newVx = -newVx * 0.95;
          newX = newX < 5 ? 5 : 95;
          playBounceSound();
        }
        if (newY < 5 || newY > 95) {
          newVy = -newVy * 0.95;
          newY = newY < 5 ? 5 : 95;
          playBounceSound();
        }

        return {
          ...w,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: w.rotation + w.vx * 2,
          opacity: 1 - fadeProgress,
        };
      }));

      if (frameCount < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        setPhase(6);
      }
    };

    requestAnimationFrame(animate);
  }, [showWalterBounce, playBounceSound]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ["#c4a77d", "#e8d5b7", "#8b7355", "#f5e6d3", "#d4b896"][Math.floor(Math.random() * 5)],
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    // Epic sound sequence
    playSound(100, 0.5, "sawtooth", 0);
    playSound(150, 0.5, "sawtooth", 50);
    playSound(200, 0.5, "sawtooth", 100);

    // Rising arpeggio
    const notes = [261, 329, 392, 523, 659, 784, 1046];
    notes.forEach((note, i) => {
      playSound(note, 0.3, "triangle", 500 + i * 150);
    });

    // Phase transitions with sounds
    const timers = [
      setTimeout(() => {
        setPhase(1);
        playChord([261, 329, 392], 0.5);
      }, 500),
      setTimeout(() => {
        setPhase(2);
        playChord([293, 369, 440], 0.5);
      }, 1500),
      setTimeout(() => {
        setPhase(3);
        playChord([329, 415, 493], 0.5);
        // Start the WALTER bounce madness
        setShowWalterBounce(true);
      }, 2500),
      setTimeout(() => {
        setPhase(4);
        playChord([349, 440, 523], 0.5);
      }, 4000),
      setTimeout(() => {
        setPhase(5);
        playChord([261, 329, 392, 523, 659, 784], 1.5);
        playSound(130, 1.5, "sawtooth");
      }, 6000),
      setTimeout(() => {
        onComplete();
      }, 9000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete, playSound, playChord]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#1a1510]">
      {/* Animated background gradients */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: phase >= 1
            ? `radial-gradient(circle at 50% 50%,
                ${phase >= 5 ? '#c4a77d' : '#3d3530'} 0%,
                transparent 50%)`
            : 'transparent',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Color flash backgrounds */}
      {showWalterBounce && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${Date.now() / 20 % 360}deg,
              rgba(196, 167, 125, 0.3),
              rgba(139, 115, 85, 0.3),
              rgba(232, 213, 183, 0.3))`,
            animation: 'colorShift 0.5s linear infinite',
          }}
        />
      )}

      {/* Spinning light rays */}
      {phase >= 2 && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute h-[200vh] w-2 origin-center"
              style={{
                background: `linear-gradient(to top, transparent, ${
                  ['#c4a77d', '#e8d5b7', '#8b7355'][i % 3]
                }, transparent)`,
                transform: `rotate(${i * 30}deg)`,
                animation: `spin ${8 - phase}s linear infinite`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* Particles */}
      {phase >= 3 && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `float 3s ease-in-out infinite, twinkle 1s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 10px ${particle.color}, 0 0 20px ${particle.color}`,
          }}
        />
      ))}

      {/* BOUNCING WALTERs */}
      {walters.map((walter) => (
        <div
          key={walter.id}
          className="pointer-events-none absolute text-center"
          style={{
            left: `${walter.x}%`,
            top: `${walter.y}%`,
            transform: `translate(-50%, -50%) scale(${walter.scale}) rotate(${walter.rotation}deg)`,
            opacity: walter.opacity,
            transition: 'opacity 0.1s',
          }}
        >
          <span
            className="whitespace-nowrap text-5xl font-black tracking-wider md:text-7xl"
            style={{
              background: `linear-gradient(${walter.rotation}deg, #f5e6d3 0%, #c4a77d 50%, #8b7355 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: 'none',
              filter: `drop-shadow(0 0 ${20 * walter.scale}px rgba(196, 167, 125, 0.8))`,
            }}
          >
            WALTER
          </span>
        </div>
      ))}

      {/* Concentric rings */}
      {phase >= 4 && (
        <div className="absolute flex items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2"
              style={{
                width: `${(i + 1) * 150}px`,
                height: `${(i + 1) * 150}px`,
                borderColor: '#c4a77d',
                animation: `ringPulse 2s ease-out infinite`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Main text container */}
      <div className="relative z-10 text-center">
        {/* BIENVENIDO */}
        <div
          className="overflow-hidden"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(50px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h1
            className="text-6xl font-bold tracking-[0.3em] text-transparent md:text-8xl"
            style={{
              background: 'linear-gradient(135deg, #e8d5b7 0%, #c4a77d 50%, #8b7355 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              textShadow: phase >= 5 ? '0 0 60px rgba(196, 167, 125, 0.8)' : 'none',
              animation: phase >= 5 ? 'textGlow 0.5s ease-in-out infinite alternate' : 'none',
            }}
          >
            BIENVENIDO
          </h1>
        </div>

        {/* A */}
        <div
          className="my-4"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <span className="text-3xl font-light text-[#8b7355] md:text-4xl">A</span>
        </div>

        {/* Giant centered WALTER (appears after bouncing) */}
        {phase >= 5 && (
          <div
            style={{
              animation: 'walterReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <h2
              className="text-7xl font-black tracking-wider text-transparent md:text-9xl"
              style={{
                background: 'linear-gradient(180deg, #f5e6d3 0%, #c4a77d 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(196, 167, 125, 0.6))',
              }}
            >
              WALTER
            </h2>
          </div>
        )}

        {/* OS */}
        <div
          style={{
            opacity: phase >= 5 ? 1 : 0,
            transform: phase >= 5 ? 'translateX(0)' : 'translateX(100px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h2
            className="text-8xl font-black tracking-[0.5em] text-transparent md:text-[12rem]"
            style={{
              background: 'linear-gradient(180deg, #c4a77d 0%, #8b7355 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              filter: phase >= 5 ? 'drop-shadow(0 0 40px rgba(139, 115, 85, 0.8))' : 'none',
            }}
          >
            OS
          </h2>
        </div>

        {/* Lotus icon */}
        {phase >= 5 && (
          <div
            className="mt-8 text-6xl"
            style={{
              animation: 'floatLotus 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 20px rgba(196, 167, 125, 0.8))',
            }}
          >
            🪷
          </div>
        )}
      </div>

      {/* Flash overlay */}
      {phase >= 5 && (
        <div
          className="pointer-events-none absolute inset-0 bg-white"
          style={{
            animation: 'flash 0.5s ease-out forwards',
          }}
        />
      )}

      {/* Styles */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes textGlow {
          from { filter: drop-shadow(0 0 20px rgba(196, 167, 125, 0.4)); }
          to { filter: drop-shadow(0 0 40px rgba(196, 167, 125, 0.8)); }
        }
        @keyframes floatLotus {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes walterReveal {
          0% { opacity: 0; transform: scale(3); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes colorShift {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(30deg); }
        }
      `}</style>
    </div>
  );
}
