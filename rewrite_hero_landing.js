const fs = require('fs');

const content = `
'use client';

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroLanding({ setView }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Ambient Ethereal Gold Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight * 1.5;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight * 1.5;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      phase: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.15 + 0.1
    }));

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(p.phase) * 0.3; // Kinematic sine wave lateral drift
        p.phase += 0.01;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = \`rgba(212, 175, 55, \${p.opacity})\`;
        ctx.fill();
      });
      animationFrame = requestAnimationFrame(render);
    };
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

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

      // Bouncing Loop Indicator
      gsap.fromTo('.scroll-indicator', 
        { y: 0 }, 
        { y: 15, yoyo: true, repeat: -1, ease: "power1.inOut", duration: 2 }
      );

      // Parallax image scaling
      gsap.to('.hero-image', {
        scale: 1.15,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      
      // Image container slight parallax
      gsap.to('.image-container', {
        y: '15%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });

      // Text container parallax
      gsap.to('.text-container', {
        y: '30%',
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
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
      className="relative w-full h-[150vh] bg-canvas-light text-contrast-midnight overflow-hidden"
    >
      {/* Particle Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0"
      />

      <div className="sticky top-0 w-full h-screen flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 py-24 gap-12 overflow-hidden pointer-events-none">
        
        {/* Left Side: Massive Typography */}
        <div className="flex-1 flex flex-col justify-center relative z-10 w-full h-full pt-16 text-container pointer-events-auto">
          
          <div className="relative mb-0" style={{ zIndex: 20 }}>
            <h1 className="modern-text text-soul text-[12vw] sm:text-[10vw] lg:text-[8vw] xl:text-[9vw] whitespace-nowrap bg-canvas-light relative z-20 pt-4 px-2">
              The Modern
            </h1>
          </div>
          
          <div className="relative overflow-hidden z-10" style={{ marginTop: '-2vw' }}>
            <h1 className="archive-text text-soul text-[12vw] sm:text-[10vw] lg:text-[8vw] xl:text-[9vw] italic text-contrast-sepia ml-8 lg:ml-16 whitespace-nowrap pt-2">
              Archive
            </h1>
          </div>

          <div className="reveal-text mt-12 lg:mt-24 max-w-sm pl-2 lg:pl-4 border-l border-contrast-midnight/20 relative z-30">
            <p className="text-core text-sm leading-relaxed text-contrast-midnight/80">
              A bespoke digital reading experience. Hyper-premium, editorial-grade architecture designed for deep focus and aesthetic immersion.
            </p>
            
            <button 
              onClick={handleEnterLibrary}
              onMouseEnter={handleBtnEnter}
              onMouseLeave={handleBtnLeave}
              className="mt-8 px-6 py-3 rounded-full border border-contrast-midnight text-core text-xs uppercase tracking-widest hover:bg-contrast-midnight hover:text-canvas-light transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              Enter Library
            </button>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-6 flex flex-col items-center gap-4 text-contrast-midnight/50">
            <span className="text-[10px] tracking-widest uppercase font-sans writing-vertical-rl rotate-180">
              Scroll to Explore
            </span>
            <div className="scroll-indicator flex flex-col items-center gap-1">
              <div className="w-[1px] h-12 bg-contrast-midnight/30"></div>
              <div className="w-2 h-2 rounded-full border border-contrast-midnight/50"></div>
            </div>
          </div>
          
        </div>

        {/* Right Side: Image Container */}
        <div className="flex-1 w-full h-[60vh] lg:h-[85vh] relative flex items-end justify-end mt-12 lg:mt-0 pointer-events-auto">
          
          {/* Vertical Side Label */}
          <div className="absolute top-0 right-0 h-full w-12 hidden lg:flex items-start justify-center z-20">
            <div className="reveal-text origin-top-right rotate-90 translate-y-full text-core text-[10px] tracking-[0.3em] uppercase whitespace-nowrap text-contrast-midnight/50">
              M o d e r n L i b r a r y  —  Est. 2026
            </div>
          </div>

          {/* Image Split Frame */}
          <div className="image-container relative overflow-hidden bg-contrast-sepia w-full lg:w-[90%] h-full shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2190&auto=format&fit=crop"
              alt="Classic Library"
              className="hero-image w-full h-full object-cover opacity-80 mix-blend-luminosity"
            />
            
            {/* Glassmorphism Interactive Panel over the image */}
            <div className="glass-panel absolute bottom-0 left-0 w-full z-10 box-border p-6 border-t border-glass-border backdrop-blur-md bg-white/5">
              <div className="text-core text-xs font-medium text-canvas-light uppercase tracking-wider mb-2">
                Featured Collection
              </div>
              <h3 className="text-soul text-3xl text-white leading-tight">
                The Architecture of Light
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync('src/components/HeroLanding.js', content, 'utf8');
console.log('HeroLanding.js successfully updated.');
