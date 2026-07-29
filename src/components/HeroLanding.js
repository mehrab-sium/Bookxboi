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
    gsap.to(e.currentTarget, { scale: 1.03, boxShadow: '0 12px 35px rgba(232,112,52,0.4)', ease: 'power2.out', duration: 0.3 });
  };
  const handleBtnLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, boxShadow: '5px 5px 0px #F7F4EF', ease: 'power2.out', duration: 0.3 });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between px-6 sm:px-12 lg:px-20 pt-28 pb-16 overflow-hidden pointer-events-auto"
    >
      {/* Content Container (Left Aligned with Refined Editorial Layout) */}
      <div className="flex-1 flex flex-col justify-center items-start text-left max-w-4xl relative z-20 pointer-events-auto mt-4 sm:mt-10">
        
        {/* Editorial Sub-Badge */}
        <div className="hero-sub-text inline-flex items-center gap-2 px-3 py-1 text-[#F7F4EF]/85 border-l-2 border-[#E87034] pl-3 mb-6 font-mono text-[11px] uppercase tracking-[0.2em] bg-black/30 backdrop-blur-md rounded-r-md">
          <span>[ ISSUE 2026 — CLASSIC READER ]</span>
        </div>

        {/* Hero Main Line */}
        <h1 
          className="hero-main-title text-soul text-[9.5vw] sm:text-[5.5vw] lg:text-[4.2vw] leading-[1.04] font-serif text-[#F7F4EF] drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)] tracking-tight mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Don't let some grumpy word wake you up from the <span className="italic font-normal underline decoration-[#E87034] decoration-2 underline-offset-8">classic world.</span>
        </h1>

        {/* Frosted Glass Quote & Explanatory Card (Translucent & Soft Blurred) */}
        <div 
          className="hero-sub-text p-6 sm:p-8 rounded-2xl mb-8 w-full max-w-2xl relative shadow-2xl"
          style={{
            background: 'rgba(14, 18, 17, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
          }}
        >
          <div className="absolute -top-3 left-6 bg-[#E87034] text-[#111111] font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 border border-[#111111] rounded-sm">
            [ CONTEXT ENGINE v2.0 ]
          </div>
          
          {/* Sub-text */}
          <h2 
            className="text-xl sm:text-2xl font-medium text-[#F7F4EF] mb-3 leading-snug pt-1"
            style={{ fontFamily: "'Hind Siliguri', var(--font-inter), sans-serif" }}
          >
            Just select it, <span className="text-[#E87034] font-bold underline decoration-2 underline-offset-4">context চলে আসবে।</span>
          </h2>

          {/* Small Line */}
          <p 
            className="hero-small-line text-sm sm:text-base text-[#F7F4EF]/85 leading-relaxed font-normal"
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
            className="px-8 py-4 bg-[#E87034] text-[#111111] text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-300 pointer-events-auto border-2 border-[#111111] shadow-[5px_5px_0px_#F7F4EF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0px_#F7F4EF] rounded-lg"
          >
            <BookOpen className="w-4 h-4 text-[#111111]" />
            Enter Library ↵
          </button>
        </div>

      </div>

      {/* GSAP Scroll Indicator */}
      <div 
        className="relative z-20 flex items-center gap-3 text-[#F7F4EF] scroll-wrapper-anim pointer-events-auto cursor-pointer mt-12 self-start bg-[#111111]/75 backdrop-blur-md px-4 py-2 border border-white/20 shadow-[3px_3px_0px_#E87034] rounded-md" 
        ref={scrollRef}
        onClick={handleEnterLibrary}
      >
        <div className="relative flex items-center justify-center">
          <div className="ring-ping absolute w-4 h-4 border border-[#E87034]"></div>
          <div className="w-2 h-2 bg-[#E87034]"></div>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#F7F4EF]">
          Scroll to explore archive ↓
        </span>
      </div>

    </section>
  );
}
