'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import GlobalHeader from '../components/GlobalHeader';
import HeroLanding from '../components/HeroLanding';
import ParticleSystem from '../components/ParticleSystem';
import Footer from '../components/Footer';

const ReaderApp = dynamic(() => import('../components/ReaderApp'), { ssr: false });

export default function Home() {
  const containerRef = useRef(null);

  const handleSetView = (targetView) => {
    if (targetView === 'app' || targetView === 'archive') {
      const archiveEl = document.getElementById('archive');
      if (archiveEl) {
        archiveEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (targetView === 'landing') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#F5F2EB] text-[#1C2321] relative overflow-x-hidden">
      <GlobalHeader setView={handleSetView} />
      
      {/* Global Ambient Particle System */}
      <ParticleSystem />
      
      {/* Hero Landing Section */}
      <HeroLanding setView={handleSetView} />
      
      {/* Library Archive Body Section (Continuous Scroll down with GSAP showcase) */}
      <div className="relative z-10 bg-[#F5F2EB]/90 backdrop-blur-md border-t border-contrast-midnight/10 shadow-[0_-20px_50px_rgba(0,0,0,0.15)]">
        <ReaderApp />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
