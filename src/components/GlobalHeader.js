'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Key, BookOpen, Info, BookMarked } from 'lucide-react';
import gsap from 'gsap';

export default function GlobalHeader({ setView }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  
  const curtainRef = useRef(null);
  const crossRef = useRef(null);
  const logoLeftRef = useRef(null);
  const logoRightRef = useRef(null);
  const aboutOverlayRef = useRef(null);
  const aboutPanelRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogoClick = () => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (setView) setView('landing');
  };

  const handleLinkEnter = (e) => {
    gsap.to(e.currentTarget, { scale: 1.02, ease: 'power2.out', duration: 0.3 });
  };
  const handleLinkLeave = (e) => {
    gsap.to(e.currentTarget, { scale: 1, ease: 'power2.out', duration: 0.3 });
  };

  const handleLibraryClick = (e) => {
    e.preventDefault();
    const archiveEl = document.getElementById('archive');
    if (archiveEl) {
      archiveEl.scrollIntoView({ behavior: 'smooth' });
    } else if (setView) {
      setView('app');
    }
    setIsMenuOpen(false);
  };

  // Cinematic Intro Sequence & GSAP Gold Color Morph Loop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!crossRef.current || !logoLeftRef.current || !logoRightRef.current || !curtainRef.current) return;

    document.body.style.overflow = 'hidden';
    
    const crossRect = crossRef.current.getBoundingClientRect();
    const centerY = window.innerHeight / 2;
    const targetY = centerY - crossRect.top - (crossRect.height / 2);

    gsap.set(crossRef.current, { y: targetY });
    gsap.set(logoLeftRef.current, { x: 30, opacity: 0 });
    gsap.set(logoRightRef.current, { x: -30, opacity: 0 });
    gsap.set('.nav-stagger', { y: -20, opacity: 0 });
    gsap.set(curtainRef.current, { display: 'block', opacity: 1 });

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        gsap.set(curtainRef.current, { display: 'none' });
      }
    });

    tl.to({}, { duration: 0.2 })
      .to(crossRef.current, { y: 0, ease: 'power4.inOut', duration: 1.2 })
      .to(curtainRef.current, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, "-=0.6")
      .to(logoLeftRef.current, { x: 0, opacity: 1, ease: 'expo.out', duration: 1.2 }, "-=0.8")
      .to(logoRightRef.current, { x: 0, opacity: 1, ease: 'expo.out', duration: 1.2 }, "-=1.2")
      .to('.nav-inner', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=1.0")
      .to('.nav-middle', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=0.9")
      .to('.nav-outer', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=0.8");

    // GSAP Gold Accent Color Morphing Timeline
    const goldTextTargets = gsap.utils.toArray('.header-gold-morph-text');
    if (goldTextTargets.length) {
      gsap.timeline({ repeat: -1, yoyo: true })
        .to(goldTextTargets, { color: '#D4AF37', duration: 2.2, ease: 'sine.inOut' })
        .to(goldTextTargets, { color: '#F5D061', duration: 2.2, ease: 'sine.inOut' })
        .to(goldTextTargets, { color: '#FFFFFF', duration: 2.2, ease: 'sine.inOut' })
        .to(goldTextTargets, { color: '#F7F4EF', duration: 2.2, ease: 'sine.inOut' });
    }

    return () => {
      document.body.style.overflow = '';
      if (tl) tl.kill();
    };
  }, []);

  // GSAP About Overlay Animation
  useEffect(() => {
    if (isAboutOpen) {
      gsap.fromTo(aboutOverlayRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
      gsap.fromTo(aboutPanelRef.current, 
        { y: 50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power2.out' }
      );
    }
  }, [isAboutOpen]);

  // GSAP Mobile Glass Menu Animation
  useEffect(() => {
    if (isMenuOpen && mobileMenuRef.current) {
      gsap.fromTo(mobileMenuRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
      gsap.fromTo('.mobile-item',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.1 }
      );
    }
  }, [isMenuOpen]);

  const closeAbout = () => {
    gsap.to(aboutPanelRef.current, { y: 50, opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(aboutOverlayRef.current, { opacity: 0, duration: 0.4, delay: 0.1, ease: 'power2.in', onComplete: () => setIsAboutOpen(false) });
  };

  return (
    <>
      {/* Off-White Intro Canvas */}
      <div 
        ref={curtainRef}
        className="fixed inset-0 z-50 bg-[#F5F2EB] pointer-events-none"
      />

      <header className="fixed top-0 left-0 w-full z-[60] pointer-events-auto text-[#F5F2EB]">
        <div className="max-w-screen-2xl mx-auto px-6 py-6 flex items-center justify-between">
          
          {/* Left Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-12 text-core text-[11px] uppercase tracking-widest font-semibold">
            <a 
              href="#" 
              onClick={handleLibraryClick}
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-outer inline-block transition-colors duration-300 hover:text-[#D4AF37]"
            >
              Library
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setIsAboutOpen(true); }}
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-middle inline-block transition-colors duration-300 hover:text-[#D4AF37]"
            >
              About
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-inner inline-block transition-colors duration-300 hover:text-[#D4AF37]"
            >
              Journals
            </a>
          </nav>

          {/* Center Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 top-6 flex flex-col items-center justify-center cursor-pointer">
            <Link href="/" onClick={handleLogoClick} className="block group">
              <div 
                className="text-soul text-4xl sm:text-5xl font-semibold tracking-tight flex items-center gap-4 text-[#F7F4EF]"
                style={{ lineHeight: 'normal', paddingBottom: '4px' }}
              >
                <div>
                  <span ref={logoLeftRef} className="inline-block">বুক</span>
                </div>
                
                <span ref={crossRef} className="font-sans font-light header-gold-morph-text text-2xl sm:text-3xl mt-1">╳</span>
                
                <div>
                  <span ref={logoRightRef} className="inline-block">Boi</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-10 text-core text-[11px] uppercase tracking-widest font-semibold">
            <a 
              href="#"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave} 
              className="nav-stagger nav-inner inline-block transition-colors duration-300 hover:text-[#D4AF37]"
            >
              Preferences
            </a>
            <a 
              href="#"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-middle inline-block transition-colors duration-300 hover:text-[#D4AF37]"
            >
              Search
            </a>
            <Link 
              href="/settings/keys"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-outer inline-block transition-colors duration-300 hover:text-[#D4AF37] flex items-center"
              title="API Settings"
            >
              <Key size={18} />
            </Link>
          </nav>

          {/* Mobile Burger Menu Button (Glassmorphic Circle Badge) */}
          <button 
            className="md:hidden ml-auto z-[70] w-11 h-11 rounded-full flex items-center justify-center text-[#F7F4EF] bg-black/50 backdrop-blur-xl border border-white/20 shadow-lg active:scale-95 transition-transform"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X size={20} strokeWidth={2} className="header-gold-morph-text" /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>

        {/* Mobile Glassmorphism Menu Overlay */}
        {isMenuOpen ? (
          <div 
            ref={mobileMenuRef}
            className="fixed inset-0 z-[65] flex flex-col justify-between p-8 pt-28 pointer-events-auto"
            style={{
              background: 'rgba(10, 13, 12, 0.94)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="flex flex-col gap-6 max-w-sm mx-auto w-full">
              
              <div className="mobile-item text-xs font-mono header-gold-morph-text uppercase tracking-widest border-b border-white/10 pb-2">
                [ NAVIGATION MENU ]
              </div>

              <a 
                href="#" 
                onClick={handleLibraryClick} 
                className="mobile-item text-soul text-3xl text-[#F7F4EF] hover:text-[#D4AF37] flex items-center justify-between py-2 border-b border-white/5 transition-colors"
              >
                <span className="flex items-center gap-3"><BookOpen size={22} className="header-gold-morph-text" /> Library</span>
                <span className="text-xs font-mono text-white/40">01</span>
              </a>

              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsAboutOpen(true); }} 
                className="mobile-item text-soul text-3xl text-[#F7F4EF] hover:text-[#D4AF37] flex items-center justify-between py-2 border-b border-white/5 transition-colors"
              >
                <span className="flex items-center gap-3"><Info size={22} className="header-gold-morph-text" /> About</span>
                <span className="text-xs font-mono text-white/40">02</span>
              </a>

              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); }}
                className="mobile-item text-soul text-3xl text-[#F7F4EF] hover:text-[#D4AF37] flex items-center justify-between py-2 border-b border-white/5 transition-colors"
              >
                <span className="flex items-center gap-3"><BookMarked size={22} className="header-gold-morph-text" /> Journals</span>
                <span className="text-xs font-mono text-white/40">03</span>
              </a>

              <Link 
                href="/settings/keys"
                onClick={() => setIsMenuOpen(false)}
                className="mobile-item text-soul text-3xl text-[#F7F4EF] hover:text-[#D4AF37] flex items-center justify-between py-2 border-b border-white/5 transition-colors"
              >
                <span className="flex items-center gap-3"><Key size={22} className="header-gold-morph-text" /> API Settings</span>
                <span className="text-xs font-mono text-white/40">04</span>
              </Link>
            </div>

            {/* Mobile Menu Footer */}
            <div className="mobile-item max-w-sm mx-auto w-full text-center text-xs font-mono text-[#F7F4EF]/60 pt-6 border-t border-white/10">
              BookXBoi Editorial Reader © 2026
            </div>
          </div>
        ) : null}
      </header>

      {/* About Overlay */}
      {isAboutOpen ? (
        <div 
          ref={aboutOverlayRef} 
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center p-6 bg-black/60 pointer-events-auto"
          style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          onClick={closeAbout}
        >
          <div 
            ref={aboutPanelRef}
            className="rounded-2xl p-8 max-w-lg w-full text-[#F7F4EF] shadow-2xl relative border border-white/20"
            style={{ background: 'rgba(14, 18, 17, 0.95)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeAbout} 
              className="absolute top-6 right-6 text-[#F7F4EF]/60 hover:text-[#D4AF37] transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <h3 className="text-soul text-3xl mb-6 text-white leading-tight font-serif" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              The Synthesis of Art & Intellect.
            </h3>
            <p className="text-core text-sm leading-relaxed text-[#F7F4EF]/85 font-sans">
              BookXBoi is engineered for the deep reader. It is an offline-first sanctuary designed to strip away the noise of the modern web. By fusing absolute typographic precision with invisible, context-aware machine learning, it allows you to explore the profound depths of literature without ever breaking your focus.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
