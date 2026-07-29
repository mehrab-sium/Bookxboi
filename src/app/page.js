'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import GlobalHeader from '../components/GlobalHeader';
import HeroLanding from '../components/HeroLanding';
import BookCoversCarousel from '../components/BookCoversCarousel';
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
    <main ref={containerRef} className="min-h-screen bg-[#0A0D0C] text-[#F5F2EB] relative overflow-x-hidden">
      
      {/* 1. Continuous GSAP Book Covers Carousel Background (Replaces Static Background Photos) */}
      <BookCoversCarousel />

      {/* Global Header */}
      <GlobalHeader setView={handleSetView} />
      
      {/* Global Ambient Particle System */}
      <ParticleSystem />
      
      {/* Hero Landing Section */}
      <HeroLanding setView={handleSetView} />
      
      {/* Library Archive Body Section (Frosted Glass Panel over ambient background) */}
      <div id="archive" className="relative z-20 bg-[#F5F2EB]/90 backdrop-blur-2xl border-t border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] text-[#1C2321]">
        <ReaderApp />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
