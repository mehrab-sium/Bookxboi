'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import GlobalHeader from '../components/GlobalHeader';
import HeroLanding from '../components/HeroLanding';
import ParticleSystem from '../components/ParticleSystem';

const ReaderApp = dynamic(() => import('../components/ReaderApp'), { ssr: false });

export default function Home() {
  const [view, setView] = useState('landing'); // 'landing' | 'transitioning' | 'app'
  const containerRef = useRef(null);

  const handleSetView = (newView) => {
    if (newView === 'app' && view === 'landing') {
      setView('transitioning');
      
      // GSAP "Slack" Animation before mounting Library
      gsap.to('.hero-transition-wrapper', {
        scale: 0.95,
        opacity: 0,
        y: 30,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          setView('app');
        }
      });
    } else {
      setView(newView);
    }
  };

  // When returning to landing from app
  useEffect(() => {
    if (view === 'landing') {
      gsap.fromTo('.hero-transition-wrapper', 
        { scale: 0.95, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [view]);

  return (
    <main ref={containerRef} className={`min-h-screen ${view === 'app' ? 'bg-[#F5F2EB]' : 'bg-transparent'}`}>
      <GlobalHeader setView={handleSetView} />
      
      {/* Global Particle System */}
      {(view === 'landing' || view === 'transitioning') && <ParticleSystem />}
      
      {(view === 'landing' || view === 'transitioning') && (
        <div className="hero-transition-wrapper">
          <HeroLanding setView={handleSetView} />
          {/* Scroll buffer to allow scroll-driven animations to run */}
          <div className="h-screen bg-[#F5F2EB] border-t border-contrast-midnight/10 flex items-center justify-center">
            <p className="text-core text-contrast-midnight/40 tracking-widest uppercase text-xs">
              End of Layout Demonstration
            </p>
          </div>
        </div>
      )}

      {view === 'app' && (
        <ReaderApp />
      )}
    </main>
  );
}
