'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroLanding({ setView }) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 4. The Multi-Dimensional Hero Curtain Reveal
      // Animate "The Modern"
      gsap.fromTo('.modern-text', 
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );

      // Animate "Archive" sliding down from behind "The Modern"
      gsap.fromTo('.archive-text', 
        { y: '-100%' }, 
        { y: '0%', duration: 1.4, ease: 'power3.out', delay: 0.4 }
      );

      // General Text Reveal
      gsap.utils.toArray('.reveal-text').forEach((el, i) => {
        gsap.fromTo(el, 
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1, duration: 1.2, ease: 'power3.out',
            delay: 0.6 + (i * 0.1),
            scrollTrigger: {
              trigger: el,
              start: "top 95%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // Bouncing Loop Indicator & Ring
      if (scrollRef.current) {
        gsap.to('.scroll-wrapper-anim', { y: 15, yoyo: true, repeat: -1, ease: "power1.inOut", duration: 1.5 });
        gsap.fromTo('.ring-ping', 
          { scale: 1, opacity: 0.8 }, 
          { scale: 3, opacity: 0, repeat: -1, duration: 1.5, ease: "power2.out" }
        );
      }

    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  const handleEnterLibrary = () => {
    if (setView) setView('app');
  };

  const handleBtnEnter = (e) => {
    gsap.to(e.currentTarget, { scale: 1.02, borderColor: 'rgba(28,35,33,0.8)', ease: 'power2.out', duration: 0.3 });
  };
  const handleBtnLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, borderColor: 'rgba(28,35,33,1)', ease: 'power2.out', duration: 0.3 });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[150vh] overflow-hidden"
    >
      {/* 1. Global Canvas & Full Un-cropped Background Photo */}
      <div className="fixed inset-0 w-full h-full -z-50 bg-[#0a0c0b] flex items-center justify-center overflow-hidden select-none pointer-events-none">
        {/* Ambient Blurred Background Bleed to Fill Screen Edges on 19:6 / Ultra-wides Widescreens */}
        <Image 
          src="/fast-load-book-x-boi.jpg?v=2"
          alt=""
          fill
          priority
          quality={25}
          className="object-cover opacity-40 blur-3xl scale-110 pointer-events-none"
        />
        
        {/* Main 100% Uncropped Whole Photo Container */}
        <div className="relative w-full h-full max-w-[100vw] max-h-[100vh] flex items-center justify-center">
          <Image 
            src="/fast-load-book-x-boi.jpg?v=2"
            alt="Book X Boi Hero Background"
            fill
            priority
            sizes="100vw"
            quality={95}
            className="object-contain w-full h-full transition-all duration-700 ease-out"
          />
        </div>

        {/* Lightweight Vignette Scrim - Ensures full photo remains visible while providing crisp text contrast */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 35% 50%, rgba(10, 12, 11, 0.6) 0%, rgba(10, 12, 11, 0.25) 55%, rgba(10, 12, 11, 0.65) 100%)"
          }}
        />
        {/* Soft edge gradient for header & footer readability */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(10, 12, 11, 0.5) 0%, transparent 20%, transparent 80%, rgba(10, 12, 11, 0.6) 100%)"
          }}
        />
      </div>

      <div className="sticky top-0 w-full h-screen flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 py-24 gap-12 overflow-hidden pointer-events-none">
        
        {/* Massive Typography - Left Aligned with negative space */}
        <div className="flex-1 flex flex-col justify-center items-start text-left relative z-10 w-full h-full pt-16 pl-6 lg:pl-32 xl:pl-40 text-container pointer-events-auto">
          
          <div className="relative mb-0" style={{ zIndex: 20 }}>
            {/* 2. Typography Contrast with Crisp Drop Shadows */}
            <h1 
              className="modern-text text-soul text-[12vw] sm:text-[10vw] lg:text-[8vw] xl:text-[9vw] whitespace-nowrap relative pt-4 pr-4 drop-shadow-[0_6px_28px_rgba(0,0,0,0.95)]" 
              style={{ color: '#F5F2EB' }}
            >
              The Modern
            </h1>
          </div>
          
          {/* Adjusted overlap slightly so it sits nicely under */}
          <div className="relative overflow-hidden z-10" style={{ marginTop: '-0.5vw' }}>
            <h1 
              className="archive-text text-soul text-[12vw] sm:text-[10vw] lg:text-[8vw] xl:text-[9vw] italic ml-8 lg:ml-24 whitespace-nowrap pt-2 drop-shadow-[0_6px_28px_rgba(0,0,0,0.95)]" 
              style={{ color: '#F5F2EB' }}
            >
              Archive
            </h1>
          </div>

          <div className="reveal-text mt-8 lg:mt-16 max-w-sm p-6 rounded-2xl backdrop-blur-md bg-[#0a0c0b]/50 border border-[#F5F2EB]/15 shadow-2xl relative z-30">
            <p className="text-core text-sm leading-relaxed text-[#F5F2EB] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] font-normal">
              A bespoke digital reading experience. Hyper-premium, editorial-grade architecture designed for deep focus and aesthetic immersion.
            </p>
            
            <button 
              onClick={handleEnterLibrary}
              onMouseEnter={handleBtnEnter}
              onMouseLeave={handleBtnLeave}
              className="mt-6 px-6 py-3 rounded-full border border-[#F5F2EB] text-[#F5F2EB] text-core text-xs uppercase tracking-widest hover:bg-[#F5F2EB] hover:text-[#111413] transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto shadow-lg"
            >
              Enter Library
            </button>
          </div>
          
          {/* 5. Restore the GSAP Scroll Indicator with Golden Rings */}
          <div className="absolute bottom-12 left-6 lg:left-12 flex flex-col items-center gap-12 text-[#F5F2EB]/80 scroll-wrapper-anim" ref={scrollRef}>
            <span className="text-[10px] tracking-widest uppercase font-sans -rotate-90 whitespace-nowrap origin-bottom text-[#F5F2EB]/50 mt-12 mb-8">
              Scroll to Explore
            </span>
            <div className="flex flex-col items-center gap-0">
              <div style={{ width: '1px', height: '60px', background: 'rgba(245, 242, 235, 0.3)' }}></div>
              <div className="relative flex items-center justify-center mt-1">
                {/* Ping Ring */}
                <div className="ring-ping absolute w-4 h-4 rounded-full border border-[rgba(212,175,55,0.8)]"></div>
                {/* Solid Dot */}
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#d4af37' }} className="relative z-10 shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </section>
  );
}
