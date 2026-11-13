'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface SceneProps {
  children: ReactNode;
  id: string;
  title?: string;
  subtitle?: string;
  background?: 'stars' | 'clouds' | 'route' | 'pipeline' | 'horizon' | 'map' | 'provenance' | 'control';
  parallax?: boolean;
  className?: string;
}

export function Scene({
  children,
  id,
  title,
  subtitle,
  background = 'stars',
  parallax = false,
  className,
}: SceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sceneRef.current) {
      observer.observe(sceneRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!parallax || !sceneRef.current) return;

    const handleScroll = () => {
      if (!sceneRef.current) return;
      const rect = sceneRef.current.getBoundingClientRect();
      const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setParallaxOffset(scrollPercent * 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  const backgroundClasses = {
    stars: 'bg-gradient-to-b from-midnight-navy via-obsidian to-midnight-navy',
    clouds: 'bg-gradient-to-b from-surface/70 via-obsidian to-midnight-navy',
    route: 'bg-gradient-to-b from-atmospheric-blue/5 via-transparent to-midnight-navy',
    pipeline: 'bg-gradient-to-b from-electric-cyan/10 via-transparent to-midnight-navy',
    horizon: 'bg-gradient-to-b from-amber-900/5 via-transparent to-midnight-navy',
    map: 'bg-gradient-to-b from-atmospheric-blue/10 via-transparent to-midnight-navy',
    provenance: 'bg-gradient-to-b from-emerald-900/5 via-transparent to-midnight-navy',
    control: 'bg-gradient-to-b from-midnight-navy via-obsidian to-obsidian',
  };

  return (
    <section
      ref={sceneRef}
      id={id}
      className={clsx(
        'min-h-screen snap-section relative overflow-hidden',
        backgroundClasses[background],
        className
      )}
    >
      {/* Background pattern */}
      <div
        className={clsx(
          'absolute inset-0 transition-opacity duration-1000',
          isVisible ? 'opacity-30' : 'opacity-10'
        )}
        style={parallax ? { transform: `translateY(${parallaxOffset}px)` } : {}}
      >
        {background === 'stars' && <StarsPattern />}
        {background === 'clouds' && <CloudsPattern />}
        {background === 'route' && <RoutePattern />}
        {background === 'pipeline' && <PipelinePattern />}
        {background === 'horizon' && <HorizonPattern />}
        {background === 'map' && <MapPattern />}
        {background === 'provenance' && <ProvenancePattern />}
        {background === 'control' && <ControlPattern />}
      </div>

      {/* Scene content */}
      <div className={clsx(
        'relative z-10 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12',
        'flex flex-col justify-center min-h-screen',
        'transition-all duration-1000',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      )}>
        {(title || subtitle) && (
          <div className="mb-12 text-center max-w-4xl mx-auto">
            {title && (
              <h2 className="hero-title mb-4 animate-glow-blue">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="hero-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className={clsx(
          'transition-opacity duration-700 delay-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}>
          {children}
        </div>
      </div>

      {/* Scroll indicator */}
      {isVisible && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-electric-cyan/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-electric-cyan/70 rounded-full mt-2 animate-pulse-soft" />
          </div>
        </div>
      )}
    </section>
  );
}

interface SceneTransitionProps {
  from: string;
  to: string;
  label: string;
}

export function SceneTransition({ from, to, label }: SceneTransitionProps) {
  return (
    <div className="h-32 bg-gradient-to-b from-transparent via-atmospheric-blue/5 to-transparent flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-electric-cyan/10 via-transparent to-transparent" />
      <div className="relative z-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-xs text-muted-silver uppercase tracking-widest">{from}</span>
          <div className="w-12 h-px bg-gradient-to-r from-transparent via-electric-cyan to-transparent" />
          <span className="text-xs text-muted-silver uppercase tracking-widest">{to}</span>
        </div>
        <p className="text-sm text-electric-cyan font-semibold tracking-widest uppercase">
          {label}
        </p>
      </div>
    </div>
  );
}

// Pattern components
function StarsPattern() {
  return (
    <div className="absolute inset-0">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-[1px] h-[1px] bg-white rounded-full animate-pulse-soft"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.3 + Math.random() * 0.7,
          }}
        />
      ))}
    </div>
  );
}

function CloudsPattern() {
  return (
    <div className="absolute inset-0">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-gradient-to-r from-white/5 to-white/10 rounded-full blur-xl"
          style={{
            width: `${100 + Math.random() * 200}px`,
            height: `${40 + Math.random() * 60}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: `translateX(${(Math.random() - 0.5) * 100}px)`,
          }}
        />
      ))}
    </div>
  );
}

function RoutePattern() {
  return (
    <div className="absolute inset-0">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M100,200 Q250,100 400,250 Q550,400 700,300"
          stroke="url(#routeGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
      </svg>
    </div>
  );
}

function PipelinePattern() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex items-center gap-8 opacity-20">
        {['RAW', 'PARSED', 'NORMALIZED', 'QUALITY', 'INDEX'].map((stage, i) => (
          <div key={stage} className="flex items-center">
            <div className="w-12 h-12 rounded-full border border-electric-cyan/30 flex items-center justify-center">
              <span className="text-xs text-electric-cyan font-mono">{stage}</span>
            </div>
            {i < 4 && (
              <div className="w-8 h-1 bg-gradient-to-r from-electric-cyan/20 to-electric-cyan/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizonPattern() {
  return (
    <div className="absolute inset-0">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          style={{
            width: '100%',
            top: `${20 + i * 20}%`,
            opacity: 0.3 - i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

function MapPattern() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-64 h-64 border border-atmospheric-blue/20 rounded-full" />
      <div className="absolute w-48 h-48 border border-electric-cyan/20 rounded-full" />
    </div>
  );
}

function ProvenancePattern() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-500/30 rounded-full"
            style={{
              left: `${Math.cos((i * Math.PI) / 4) * 100 + 50}%`,
              top: `${Math.sin((i * Math.PI) / 4) * 100 + 50}%`,
            }}
          />
        ))}
        <div className="absolute inset-0 border border-emerald-500/10 rounded-full" />
      </div>
    </div>
  );
}

function ControlPattern() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(45deg,_transparent_25%,_rgba(30,58,138,0.05)_25%,_rgba(30,58,138,0.05)_50%,_transparent_50%,_transparent_75%,_rgba(30,58,138,0.05)_75%)] bg-[length:20px_20px]" />
  );
}