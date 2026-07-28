'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
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
    <main ref={containerRef} className="min-h-screen bg-transparent text-[#1C2321] relative overflow-x-hidden">
      
      {/* 1. Fixed Responsive Background Images */}
      {/* Desktop & Widescreen Background (16:9) */}
      <div className="fixed inset-0 w-full h-full -z-50 hidden md:block overflow-hidden select-none pointer-events-none">
        <Image 
          src="/new-16-9.webp"
          alt="Book X Boi Desktop Background"
          fill
          priority
          sizes="100vw"
          quality={95}
          className="object-cover object-center w-full h-full"
        />
        {/* Desktop Vignette Scrim */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 40% 45%, rgba(10, 12, 11, 0.45) 0%, rgba(10, 12, 11, 0.2) 60%, rgba(10, 12, 11, 0.6) 100%)"
          }}
        />
      </div>

      {/* Smartphone & Portrait Devices Background */}
      <div className="fixed inset-0 w-full h-full -z-50 block md:hidden overflow-hidden select-none pointer-events-none">
        <Image 
          src="/for-phone.webp"
          alt="Book X Boi Phone Background"
          fill
          priority
          sizes="100vw"
          quality={95}
          className="object-cover object-center w-full h-full"
        />
        {/* Mobile Scrim Gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(10, 12, 11, 0.4) 0%, rgba(10, 12, 11, 0.25) 50%, rgba(10, 12, 11, 0.65) 100%)"
          }}
        />
      </div>

      {/* 2. Floating Subtle Glass Frosted Layer */}
      <div 
        className="fixed inset-0 w-full h-full -z-40 pointer-events-none backdrop-blur-[6px] bg-[#0a0c0b]/20 transition-all duration-700 ease-out"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(245, 242, 235, 0.02) 0%, rgba(10, 12, 11, 0.25) 100%)"
        }}
      />

      <GlobalHeader setView={handleSetView} />
      
      {/* Global Ambient Particle System */}
      <ParticleSystem />
      
      {/* Hero Landing Section */}
      <HeroLanding setView={handleSetView} />
      
      {/* Library Archive Body Section (Frosted Glass Panel over ambient background) */}
      <div className="relative z-10 bg-[#F5F2EB]/85 backdrop-blur-2xl border-t border-white/20 shadow-[0_-20px_60px_rgba(0,0,0,0.3)]">
        <ReaderApp />
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
