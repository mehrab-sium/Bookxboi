'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, BookOpen, Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroLanding({ setView }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero Title Entrance
      gsap.fromTo('.hero-main-title', 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.3, ease: 'power3.out', delay: 0.2 }
      );

      // Sub-text Entrance
      gsap.fromTo('.hero-sub-text', 
        { y: 35, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.5 }
      );

      // Small Supporting Line Entrance
      gsap.fromTo('.hero-small-line', 
        { y: 25, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.7 }
      );

      // CTA Button Entrance
      gsap.fromTo('.hero-cta-btn', 
        { scale: 0.9, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 1.0, ease: 'back.out(1.7)', delay: 0.9 }
      );

      // Bouncing Scroll Indicator & Golden Ring Pulse
      if (scrollRef.current) {
        gsap.to('.scroll-wrapper-anim', { y: 12, yoyo: true, repeat: -1, ease: "power1.inOut", duration: 1.6 });
        gsap.fromTo('.ring-ping', 
          { scale: 1, opacity: 0.8 }, 
          { scale: 3, opacity: 0, repeat: -1, duration: 1.6, ease: "power2.out" }
        );
      }

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const handleEnterLibrary = () => {
    const archiveEl = document.getElementById('archive');
    if (archiveEl) {
      archiveEl.scrollIntoView({ behavior: 'smooth' });
    } else if (setView) {
      setView('app');
    }
  };

  const handleBtnEnter = (e) => {
    gsap.to(e.currentTarget, { scale: 1.03, boxShadow: '0 12px 35px rgba(212,175,55,0.4)', ease: 'power2.out', duration: 0.3 });
  };
  const handleBtnLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, boxShadow: '0 8px 25px rgba(0,0,0,0.3)', ease: 'power2.out', duration: 0.3 });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between px-6 sm:px-12 lg:px-20 pt-28 pb-16 overflow-hidden pointer-events-none"
    >
      {/* Content Container (Left Aligned over the Gradual Blur Mask) */}
      <div className="flex-1 flex flex-col justify-center items-start text-left max-w-3xl relative z-20 pointer-events-auto mt-4 sm:mt-10">
        
        {/* Editorial Sub-Badge */}
        <div className="hero-sub-text inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="text-xs uppercase tracking-widest font-semibold text-[#F5F2EB]/90">
            BookXBoi Classic Reader
          </span>
        </div>

        {/* Hero Main Line */}
        <h1 
          className="hero-main-title text-soul text-[9.5vw] sm:text-[6vw] lg:text-[4.2vw] leading-[1.08] font-serif text-[#F5F2EB] drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)] tracking-tight mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Don't let some grumpy word wake you up from the classic world.
        </h1>

        {/* Glassmorphic Quote & Explanatory Card */}
        <div className="hero-sub-text backdrop-blur-xl bg-[#0b0e0d]/75 border border-[#F5F2EB]/15 p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] mb-8 w-full max-w-xl">
          {/* Sub-text */}
          <h2 
            className="text-xl sm:text-2xl font-medium text-[#F5F2EB] mb-3 leading-snug"
            style={{ fontFamily: "'Hind Siliguri', var(--font-inter), sans-serif" }}
          >
            Just select it, <span className="text-[#d4af37] font-semibold border-b border-[#d4af37]/40 pb-0.5">context চলে আসবে।</span>
          </h2>

          {/* Small Line */}
          <p 
            className="hero-small-line text-sm sm:text-base text-[#F5F2EB]/80 leading-relaxed font-normal"
            style={{ fontFamily: "'Hind Siliguri', var(--font-inter), sans-serif" }}
          >
            আমরা শুধু context দেই, ব্যাখ্যা না। পড়াটা পুরোপুরি আপনার থাকুক।
          </p>
        </div>

        {/* Primary Call to Action Button */}
        <div className="hero-cta-btn flex flex-wrap items-center gap-4">
          <button 
            onClick={handleEnterLibrary}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f5f2eb] text-[#111413] text-sm font-bold uppercase tracking-widest flex items-center gap-3 transition-all duration-300 pointer-events-auto shadow-xl"
          >
            <BookOpen className="w-4 h-4 text-[#111413]" />
            Enter Library
          </button>
        </div>

      </div>

      {/* GSAP Scroll Indicator with Golden Rings */}
      <div 
        className="relative z-20 flex items-center gap-4 text-[#F5F2EB]/80 scroll-wrapper-anim pointer-events-auto cursor-pointer mt-12 self-start" 
        ref={scrollRef}
        onClick={handleEnterLibrary}
      >
        <div className="relative flex items-center justify-center">
          <div className="ring-ping absolute w-5 h-5 rounded-full border border-[#d4af37]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_#d4af37]"></div>
        </div>
        <span className="text-xs uppercase tracking-widest font-sans font-semibold text-[#F5F2EB]/70">
          Scroll to explore library
        </span>
      </div>

    </section>
  );
}
