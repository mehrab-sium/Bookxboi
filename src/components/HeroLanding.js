'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroLanding({ setView }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero Entrance Animations
      gsap.fromTo('.hero-main-title', 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );

      gsap.fromTo('.hero-sub-text', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.4 }
      );

      gsap.fromTo('.hero-small-line', 
        { y: 20, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.6 }
      );

      gsap.fromTo('.hero-cta-btn', 
        { scale: 0.9, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', delay: 0.8 }
      );

      // Bouncing Scroll Indicator & Ring Pulse
      if (scrollRef.current) {
        gsap.to('.scroll-wrapper-anim', { y: 10, yoyo: true, repeat: -1, ease: "power1.inOut", duration: 1.6 });
        gsap.fromTo('.ring-ping', 
          { scale: 1, opacity: 0.8 }, 
          { scale: 3, opacity: 0, repeat: -1, duration: 1.6, ease: "power2.out" }
        );
      }

      // GSAP Looping Color Morphing Animation: Off-White -> White -> Gold (#D4AF37) -> Warm Gold (#F5D061) -> Loop
      const morphTargetsText = gsap.utils.toArray('.gold-morph-text');
      const morphTargetsBg = gsap.utils.toArray('.gold-morph-bg');
      const morphTargetsBorder = gsap.utils.toArray('.gold-morph-border');

      if (morphTargetsText.length) {
        gsap.timeline({ repeat: -1, yoyo: true })
          .to(morphTargetsText, { color: '#D4AF37', textDecorationColor: '#D4AF37', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsText, { color: '#F5D061', textDecorationColor: '#F5D061', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsText, { color: '#FFFFFF', textDecorationColor: '#FFFFFF', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsText, { color: '#F7F4EF', textDecorationColor: '#F7F4EF', duration: 2.2, ease: 'sine.inOut' });
      }

      if (morphTargetsBg.length) {
        gsap.timeline({ repeat: -1, yoyo: true })
          .to(morphTargetsBg, { backgroundColor: '#D4AF37', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBg, { backgroundColor: '#F5D061', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBg, { backgroundColor: '#FFFFFF', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBg, { backgroundColor: '#F7F4EF', duration: 2.2, ease: 'sine.inOut' });
      }

      if (morphTargetsBorder.length) {
        gsap.timeline({ repeat: -1, yoyo: true })
          .to(morphTargetsBorder, { borderColor: '#D4AF37', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBorder, { borderColor: '#F5D061', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBorder, { borderColor: '#FFFFFF', duration: 2.2, ease: 'sine.inOut' })
          .to(morphTargetsBorder, { borderColor: '#F7F4EF', duration: 2.2, ease: 'sine.inOut' });
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
    gsap.to(e.currentTarget, { scale: 1.03, boxShadow: '0 12px 35px rgba(212,175,55,0.5)', ease: 'power2.out', duration: 0.3 });
  };
  const handleBtnLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, boxShadow: '4px 4px 0px #F7F4EF', ease: 'power2.out', duration: 0.3 });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full min-h-[85vh] sm:min-h-screen flex flex-col justify-between px-5 sm:px-12 lg:px-20 pt-20 sm:pt-28 pb-10 sm:pb-16 overflow-hidden pointer-events-auto"
    >
      {/* Content Container (Compact Responsive Layout for Android & Desktop) */}
      <div className="flex-1 flex flex-col justify-center items-start text-left max-w-3xl relative z-20 pointer-events-auto mt-2 sm:mt-8">
        
        {/* Clean Editorial Sub-Badge (Removed AI Slop Star Icon) */}
        <div className="hero-sub-text inline-flex items-center px-3 py-1 text-[#F7F4EF]/85 border-l-2 gold-morph-border pl-3 mb-4 sm:mb-6 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md rounded-r-md">
          <span>[ ISSUE 2026 — CLASSIC READER ]</span>
        </div>

        {/* Hero Main Line (Scaled Down on Mobile for Breathable Layout) */}
        <h1 
          className="hero-main-title text-soul text-[7.5vw] sm:text-[5.5vw] lg:text-[4vw] leading-[1.06] font-serif text-[#F7F4EF] drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)] tracking-tight mb-4 sm:mb-8"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Don't let some grumpy word wake you up from the <span className="italic font-normal underline gold-morph-text decoration-2 underline-offset-4 sm:underline-offset-8">classic world.</span>
        </h1>

        {/* Frosted Glass Quote Card with Neo Editorial Bengali Typography */}
        <div 
          className="hero-sub-text p-4 sm:p-7 rounded-2xl mb-5 sm:mb-8 w-full max-w-xl relative shadow-2xl"
          style={{
            background: 'rgba(14, 18, 17, 0.68)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.45)'
          }}
        >
          {/* Top Tag Badge */}
          <div className="absolute -top-3 left-5 gold-morph-bg text-[#111111] font-mono text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 border border-[#111111] rounded-sm transition-colors">
            [ CONTEXT ENGINE v2.0 ]
          </div>
          
          {/* Sub-text — Fancy Bengali Serif Typography */}
          <h2 
            className="text-lg sm:text-2xl font-medium text-[#F7F4EF] mb-2 sm:mb-3 leading-snug pt-1"
            style={{ fontFamily: "'Tiro Bangla', 'Noto Serif Bengali', serif" }}
          >
            Just select it, <span className="gold-morph-text font-bold underline decoration-2 underline-offset-4">context চলে আসবে।</span>
          </h2>

          {/* Small Line — Elegant Bengali Typography */}
          <p 
            className="hero-small-line text-xs sm:text-base text-[#F7F4EF]/85 leading-relaxed font-normal"
            style={{ fontFamily: "'Tiro Bangla', 'Anek Bangla', serif" }}
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
            className="px-6 sm:px-8 py-3 sm:py-4 gold-morph-bg text-[#111111] text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 transition-all duration-300 pointer-events-auto border-2 border-[#111111] shadow-[4px_4px_0px_#F7F4EF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#F7F4EF] rounded-lg"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#111111]" />
            Enter Library ↵
          </button>
        </div>

      </div>

      {/* GSAP Scroll Indicator */}
      <div 
        className="relative z-20 flex items-center gap-3 text-[#F7F4EF] scroll-wrapper-anim pointer-events-auto cursor-pointer mt-6 sm:mt-12 self-start bg-[#111111]/80 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 border border-white/20 gold-morph-border shadow-[3px_3px_0px_#D4AF37] rounded-md" 
        ref={scrollRef}
        onClick={handleEnterLibrary}
      >
        <div className="relative flex items-center justify-center">
          <div className="ring-ping absolute w-3.5 h-3.5 border gold-morph-border"></div>
          <div className="w-1.5 h-1.5 gold-morph-bg rounded-full"></div>
        </div>
        <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-widest font-bold text-[#F7F4EF]">
          Scroll to explore archive ↓
        </span>
      </div>

    </section>
  );
}
