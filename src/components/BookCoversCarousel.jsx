'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { PUBLIC_BOOKS, getAllBooks } from '../lib/libraryStore';

export default function BookCoversCarousel() {
  const [covers, setCovers] = useState([]);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);

  // Load public + custom library book covers
  useEffect(() => {
    let isSubscribed = true;

    const loadCovers = async () => {
      try {
        const allBooks = await getAllBooks();
        if (!isSubscribed) return;

        const validCovers = allBooks
          .map(b => b.coverImage)
          .filter(c => c && typeof c === 'string');

        // Fallback default covers list if library list is small
        const defaultCovers = PUBLIC_BOOKS
          .map(b => b.coverImage)
          .filter(c => c && typeof c === 'string');

        const combined = [...validCovers, ...defaultCovers];
        // Deduplicate
        const uniqueCovers = Array.from(new Set(combined));

        setCovers(uniqueCovers.length > 0 ? uniqueCovers : defaultCovers);
      } catch (err) {
        const defaultCovers = PUBLIC_BOOKS.map(b => b.coverImage).filter(Boolean);
        if (isSubscribed) setCovers(defaultCovers);
      }
    };

    loadCovers();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // GSAP Swift Entrance & Deceleration Loop Animation
  useEffect(() => {
    if (covers.length === 0) return;

    let ctx = gsap.context(() => {
      // Row 1: Leftward infinite marquee
      const row1Anim = gsap.to(row1Ref.current, {
        xPercent: -50,
        repeat: -1,
        duration: 38,
        ease: 'none'
      });

      // Row 2: Rightward infinite marquee
      const row2Anim = gsap.to(row2Ref.current, {
        xPercent: 50,
        repeat: -1,
        duration: 44,
        ease: 'none'
      });

      // Row 3: Leftward infinite marquee
      const row3Anim = gsap.to(row3Ref.current, {
        xPercent: -50,
        repeat: -1,
        duration: 48,
        ease: 'none'
      });

      // Initial Swift Entrance Acceleration -> Smooth Deceleration
      // Start all animations at 4.2x speed, then decelerate down to 1.0x over 2.8 seconds
      row1Anim.timeScale(4.2);
      row2Anim.timeScale(4.2);
      row3Anim.timeScale(4.2);

      gsap.to([row1Anim, row2Anim, row3Anim], {
        timeScale: 1.0,
        duration: 2.8,
        ease: 'power3.out',
        delay: 0.1
      });
    });

    return () => ctx.revert();
  }, [covers]);

  if (covers.length === 0) return null;

  // Quadruple the array for infinite smooth looping seamlessly
  const coverStream = [...covers, ...covers, ...covers, ...covers];
  const row1Covers = coverStream;
  const row2Covers = [...coverStream].reverse();
  const row3Covers = coverStream;

  return (
    <div className="fixed inset-0 w-full h-full -z-50 overflow-hidden bg-[#0A0D0C] select-none pointer-events-none">
      
      {/* 1. Angled Infinite Book Covers Marquee Grid */}
      <div 
        className="absolute inset-0 w-[140%] h-[140%] -left-[20%] -top-[20%] flex flex-col justify-center gap-6 opacity-85"
        style={{
          transform: 'rotate(-4deg) scale(1.08)',
          transformOrigin: 'center center'
        }}
      >
        {/* Row 1 Stream */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row1Ref} className="flex gap-6 min-w-max">
            {row1Covers.map((src, i) => (
              <div 
                key={`r1-${i}`}
                className="relative w-[145px] h-[215px] sm:w-[170px] sm:h-[250px] lg:w-[195px] lg:h-[285px] rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-white/10 shrink-0 transform transition-transform duration-300"
              >
                <Image 
                  src={src} 
                  alt="Book Cover" 
                  fill 
                  sizes="(max-width: 768px) 170px, 200px"
                  className="object-cover" 
                  priority={i < 8}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 Stream (Reverse Direction) */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row2Ref} className="flex gap-6 min-w-max -ml-[50%]">
            {row2Covers.map((src, i) => (
              <div 
                key={`r2-${i}`}
                className="relative w-[145px] h-[215px] sm:w-[170px] sm:h-[250px] lg:w-[195px] lg:h-[285px] rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-white/10 shrink-0"
              >
                <Image 
                  src={src} 
                  alt="Book Cover" 
                  fill 
                  sizes="(max-width: 768px) 170px, 200px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 Stream */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row3Ref} className="flex gap-6 min-w-max">
            {row3Covers.map((src, i) => (
              <div 
                key={`r3-${i}`}
                className="relative w-[145px] h-[215px] sm:w-[170px] sm:h-[250px] lg:w-[195px] lg:h-[285px] rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-white/10 shrink-0"
              >
                <Image 
                  src={src} 
                  alt="Book Cover" 
                  fill 
                  sizes="(max-width: 768px) 170px, 200px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Shaped Color Mask & Gradual Horizontal Blur (Left-to-Right Fade) */}
      {/* On desktop: heavy blur on left (text side), fading to clear carousel on right */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 hidden md:block"
        style={{
          background: 'linear-gradient(to right, rgba(10, 13, 12, 0.98) 0%, rgba(10, 13, 12, 0.94) 38%, rgba(10, 13, 12, 0.65) 60%, rgba(10, 13, 12, 0.2) 82%, rgba(10, 13, 12, 0.05) 100%)'
        }}
      />
      <div 
        className="absolute inset-0 pointer-events-none z-10 hidden md:block"
        style={{
          backdropFilter: 'blur(26px)',
          WebkitBackdropFilter: 'blur(26px)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.3) 62%, rgba(0,0,0,0) 88%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.3) 62%, rgba(0,0,0,0) 88%)'
        }}
      />

      {/* Mobile Backdrop & Blur Scrim */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 block md:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgba(10, 13, 12, 0.95) 0%, rgba(10, 13, 12, 0.85) 55%, rgba(10, 13, 12, 0.4) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      />

      {/* Vignette Edge Shading */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          boxShadow: 'inset 0 0 120px rgba(10, 13, 12, 0.95)'
        }}
      />
    </div>
  );
}
