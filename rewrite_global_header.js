const fs = require('fs');

const content = `
'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Key } from 'lucide-react';
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

  const handleLogoClick = (e) => {
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
    if (setView) setView('app');
    setIsMenuOpen(false);
  };

  // Cinematic Intro Sequence
  useEffect(() => {
    // Only run on client, and optionally only once per session
    if (typeof window === 'undefined') return;
    
    const hasPlayed = sessionStorage.getItem('introPlayed');
    if (hasPlayed) {
      gsap.set(curtainRef.current, { display: 'none' });
      return;
    }

    document.body.style.overflow = 'hidden';
    
    // Calculate vertical distance from center to header
    const crossRect = crossRef.current.getBoundingClientRect();
    const centerY = window.innerHeight / 2;
    const targetY = centerY - crossRect.top - (crossRect.height / 2);

    // Initial hidden states
    gsap.set(crossRef.current, { y: targetY });
    gsap.set(logoLeftRef.current, { x: 30, opacity: 0 });
    gsap.set(logoRightRef.current, { x: -30, opacity: 0 });
    gsap.set('.nav-stagger', { y: -20, opacity: 0 });

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = '';
        sessionStorage.setItem('introPlayed', 'true');
        gsap.set(curtainRef.current, { display: 'none' });
      }
    });

    tl.to({}, { duration: 0.2 }) // Step A: Static for 200ms
      .to(crossRef.current, { y: 0, ease: 'power4.inOut', duration: 1.2 }) // Step B: Ascension
      // Fade the physical background curtain
      .to(curtainRef.current, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, "-=0.6")
      // Step C: Epistemic Split Reveal
      .to(logoLeftRef.current, { x: 0, opacity: 1, ease: 'expo.out', duration: 1.2 }, "-=0.8")
      .to(logoRightRef.current, { x: 0, opacity: 1, ease: 'expo.out', duration: 1.2 }, "-=1.2")
      // The Radiating Menu Cascade
      .to('.nav-inner', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=1.0")
      .to('.nav-middle', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=0.9")
      .to('.nav-outer', { y: 0, opacity: 1, ease: 'power2.out', duration: 1 }, "-=0.8");

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

      <header className="fixed top-0 left-0 w-full z-[60] mix-blend-difference text-canvas-dark pointer-events-auto">
        <div className="max-w-screen-2xl mx-auto px-6 py-8 flex items-center justify-between">
          {/* Left Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-12 text-core text-[11px] uppercase tracking-widest font-medium">
            <a 
              href="#" 
              onClick={handleLibraryClick}
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-middle inline-block transition-opacity duration-300 hover:opacity-60"
            >
              Library
            </a>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setIsAboutOpen(true); }}
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-inner inline-block transition-opacity duration-300 hover:opacity-60"
            >
              About
            </a>
          </nav>

          {/* Center Logo Redesign */}
          <div className="absolute left-1/2 -translate-x-1/2 top-8 flex flex-col items-center justify-center cursor-pointer">
            <Link href="/" onClick={handleLogoClick} className="block group">
              <div className="text-soul text-4xl sm:text-5xl font-semibold leading-none tracking-tight flex items-center gap-4">
                <div className="overflow-hidden">
                  <span ref={logoLeftRef} className="inline-block">বুক</span>
                </div>
                
                <span ref={crossRef} className="font-sans font-light opacity-90 text-[#1C2321] mix-blend-normal">╳</span>
                
                <div className="overflow-hidden">
                  <span ref={logoRightRef} className="inline-block">Boi</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-10 text-core text-[11px] uppercase tracking-widest font-medium">
            <Link 
              href="/settings/keys"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-inner inline-block transition-opacity duration-300 hover:opacity-60 flex items-center"
              title="API Settings"
            >
              <Key size={18} />
            </Link>
            <a 
              href="#"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave} 
              className="nav-stagger nav-middle inline-block transition-opacity duration-300 hover:opacity-60"
            >
              Preferences
            </a>
            <a 
              href="#"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="nav-stagger nav-outer inline-block transition-opacity duration-300 hover:opacity-60"
            >
              Search
            </a>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden ml-auto z-50 text-canvas-dark nav-stagger nav-outer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 bg-contrast-midnight text-canvas-light flex flex-col items-center justify-center gap-8 z-40 pointer-events-auto">
            <a href="#" onClick={handleLibraryClick} className="text-soul text-4xl">Library</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); setIsAboutOpen(true); }} className="text-soul text-4xl">About</a>
            <a href="#" className="text-soul text-4xl">Preferences</a>
          </div>
        )}
      </header>

      {/* About Overlay */}
      {isAboutOpen && (
        <div 
          ref={aboutOverlayRef} 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-contrast-midnight/40 pointer-events-auto"
          style={{ backdropFilter: 'blur(10px)' }}
          onClick={closeAbout}
        >
          <div 
            ref={aboutPanelRef}
            className="glass-panel-thick rounded-xl p-8 max-w-lg w-full text-canvas-light shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeAbout} 
              className="absolute top-6 right-6 text-canvas-light/60 hover:text-canvas-light transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
            <h3 className="text-soul text-3xl mb-6 text-white leading-tight">
              The Synthesis of Art & Intellect.
            </h3>
            <p className="text-core text-sm leading-relaxed text-canvas-light/80">
              Boi is engineered for the deep reader. It is an offline-first sanctuary designed to strip away the noise of the modern web. By fusing absolute typographic precision with invisible, context-aware machine learning, it allows you to explore the profound depths of literature without ever breaking your focus.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
`;

fs.writeFileSync('src/components/GlobalHeader.js', content, 'utf8');
console.log('GlobalHeader.js successfully updated.');
