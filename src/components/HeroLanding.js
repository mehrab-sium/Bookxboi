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
  const badgeScrambleRef = useRef(null);
  const heroPrefixRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // Hero Entrance Animations
      gsap.fromTo('.hero-main-title', 
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );

      gsap.fromTo('.hero-sub-text', 
        { y: 25, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.4 }
      );

      gsap.fromTo('.hero-small-line', 
        { y: 18, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.55 }
      );

      gsap.fromTo('.hero-cta-btn', 
        { scale: 0.9, opacity: 0 }, 
        { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', delay: 0.7 }
      );

      // Bouncing Scroll Indicator & Ring Pulse
      if (scrollRef.current) {
        gsap.to('.scroll-wrapper-anim', { y: 8, yoyo: true, repeat: -1, ease: "power1.inOut", duration: 1.6 });
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

      // GSAP Scramble Animation for Badge
      const runBadgeScramble = () => {
        const el = badgeScrambleRef.current;
        if (!el) return;
        const targetText = '[ CONTEXT ENGINE v2.0 ]';
        const glyphs = '!@#$%^&*()_+-=[]{}|;:?/<>';
        const length = targetText.length;
        const state = { progress: 0 };

        gsap.to(state, {
          progress: 1,
          duration: 1.1,
          ease: 'power2.inOut',
          onUpdate: () => {
            let res = '';
            const resolvedCount = Math.floor(state.progress * length);
            for (let i = 0; i < length; i++) {
              if (i < resolvedCount) {
                res += targetText[i];
              } else {
                res += glyphs[Math.floor(Math.random() * glyphs.length)];
              }
            }
            if (el) el.textContent = res;
          }
        });
      };

      // GSAP Scramble Animation for Hero Title Prefix
      const runHeroPrefixScramble = () => {
        const el = heroPrefixRef.current;
        if (!el) return;
        const targetText = "Don't let some grumpy word wake you up from the";
        const glyphs = '!@#$%^&*()_+-=[]{}|;:?/<>';
        const length = targetText.length;
        const state = { progress: 0 };

        gsap.to(state, {
          progress: 1,
          duration: 1.3,
          ease: 'power2.inOut',
          onUpdate: () => {
            let res = '';
            const resolvedCount = Math.floor(state.progress * length);
            for (let i = 0; i < length; i++) {
              if (targetText[i] === ' ') {
                res += ' ';
              } else if (i < resolvedCount) {
                res += targetText[i];
              } else {
                res += glyphs[Math.floor(Math.random() * glyphs.length)];
              }
            }
            if (el) el.textContent = res;
          }
        });
      };

      // Initial Scramble Delays & Infinite Interval Loop
      const scrambleTimeout = setTimeout(() => {
        runBadgeScramble();
        runHeroPrefixScramble();
      }, 1500);

      const scrambleInterval = setInterval(() => {
        runBadgeScramble();
        runHeroPrefixScramble();
      }, 6500);

      return () => {
        clearTimeout(scrambleTimeout);
        clearInterval(scrambleInterval);
      };

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
      className="relative w-full min-h-[100dvh] h-[100dvh] flex flex-col justify-between px-5 sm:px-10 lg:px-16 pt-16 sm:pt-24 pb-8 sm:pb-14 overflow-hidden pointer-events-auto bg-transparent"
    >
      {/* Content Container (Strict 55%-60% Vertical Left Column Grid Boundary) */}
      <div className="flex-1 flex flex-col justify-center items-start text-left w-full max-w-[84vw] md:max-w-[55%] lg:max-w-[52%] xl:max-w-[48%] relative z-20 pointer-events-auto my-auto">
        
        {/* Editorial Sub-Badge */}
        <div className="hero-sub-text inline-flex items-center px-3 py-0.5 text-[#F7F4EF]/85 border-l-2 gold-morph-border pl-2.5 mb-3 sm:mb-5 font-mono text-[9.5px] sm:text-[11px] uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md rounded-r-md">
          <span>[ ISSUE 2026 — CLASSIC READER ]</span>
        </div>

        {/* Hero Main Line with GSAP Matrix Scramble on Prefix Only */}
        <h1 
          className="hero-main-title text-soul text-[6.2vw] sm:text-[4.2vw] lg:text-[3.2vw] leading-[1.08] font-serif text-[#F7F4EF] drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)] tracking-tight mb-3 sm:mb-5"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          <span ref={heroPrefixRef}>Don't let some grumpy word wake you up from the</span>{' '}
          <span className="italic font-normal underline gold-morph-text decoration-2 underline-offset-4 sm:underline-offset-6">classic world.</span>
        </h1>

        {/* Pure Floating Editorial Text Group (Removed Blurry Container Box) */}
        <div className="hero-sub-text mb-4 sm:mb-6 w-full relative pt-2">
          {/* Top Tag Badge with Modern GSAP Text Scramble Effect */}
          <div 
            ref={badgeScrambleRef}
            className="inline-block gold-morph-bg text-[#111111] font-mono text-[8.5px] sm:text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 border border-[#111111] rounded-sm transition-colors mb-3 shadow-md"
          >
            [ CONTEXT ENGINE v2.0 ]
          </div>
          
          {/* Sub-text — Fancy Bengali Serif Typography */}
          <h2 
            className="text-base sm:text-2xl font-medium text-[#F7F4EF] mb-2 sm:mb-3 leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: "'Tiro Bangla', 'Noto Serif Bengali', serif" }}
          >
            Just select it, <span className="gold-morph-text font-bold underline decoration-2 underline-offset-4">context চলে আসবে।</span>
          </h2>

          {/* Small Line — Elegant Bengali Typography */}
          <p 
            className="hero-small-line text-[11px] sm:text-base text-[#F7F4EF]/90 leading-relaxed font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
            style={{ fontFamily: "'Tiro Bangla', 'Anek Bangla', serif" }}
          >
            আমরা শুধু context দেই, ব্যাখ্যা না। পড়াটা পুরোপুরি আপনার থাকুক।
          </p>
        </div>

        {/* Primary Call to Action Button */}
        <div className="hero-cta-btn flex flex-wrap items-center gap-3">
          <button 
            onClick={handleEnterLibrary}
            onMouseEnter={handleBtnEnter}
            onMouseLeave={handleBtnLeave}
            className="px-5 sm:px-8 py-2.5 sm:py-4 gold-morph-bg text-[#111111] text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all duration-300 pointer-events-auto border-2 border-[#111111] shadow-[4px_4px_0px_#F7F4EF] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#F7F4EF] rounded-lg"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#111111]" />
            Enter Library ↵
          </button>
        </div>

      </div>

      {/* GSAP Scroll Indicator */}
      <div 
        className="relative z-20 flex items-center gap-2.5 text-[#F7F4EF] scroll-wrapper-anim pointer-events-auto cursor-pointer mt-2 sm:mt-6 self-start bg-[#111111]/80 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-2 border border-white/20 gold-morph-border shadow-[3px_3px_0px_#D4AF37] rounded-md" 
        ref={scrollRef}
        onClick={handleEnterLibrary}
      >
        <div className="relative flex items-center justify-center">
          <div className="ring-ping absolute w-3 h-3 sm:w-3.5 sm:h-3.5 border gold-morph-border"></div>
          <div className="w-1.5 h-1.5 gold-morph-bg rounded-full"></div>
        </div>
        <span className="text-[8.5px] sm:text-[10px] font-mono uppercase tracking-widest font-bold text-[#F7F4EF]">
          Scroll to explore archive ↓
        </span>
      </div>

    </section>
  );
}
