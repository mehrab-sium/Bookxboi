'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { PUBLIC_BOOKS, getAllBooks } from '../lib/libraryStore';

// All 37 exact book cover image assets residing in /public/covers
const ALL_PROJECT_COVERS = [
  '/covers/Alexandre_Dumas_The_Count_of_Monte_Cristo.jpeg',
  '/covers/Ali_Madonna_in_a_Fur_Coat.jpg',
  '/covers/Bronte_Jane_Eyre.jpg',
  '/covers/Bronte_Wuthering_Heights.jpg',
  '/covers/Camus_The_Myth_of_Sisyphus_and_Other_Essays.jpg',
  '/covers/Camus_The_Plague.jpeg',
  '/covers/Dazai_No_Longer_Human.jpg',
  '/covers/Dickens_A_Tale_of_Two_Cities.jpg',
  '/covers/Dostoevsky_The_Idiot.jpg',
  '/covers/Dostoyevsky_Crime_and_Punishment.jpg',
  '/covers/Dostoyevsky_Notes_From_Underground.jpeg',
  '/covers/Dostoyevsky_Notes_from_the_Underground.jpg',
  '/covers/Dostoyevsky_The_Brothers_Karamazov.jpg',
  '/covers/Dostoyevsky_White_Nights.jpg',
  '/covers/Goethe_Sorrows_of_Young_Werther.jpeg',
  '/covers/H._G._Wells_The_Time_Machine_and_The_Invisible_Man.jpg',
  '/covers/Huxley_Brave_New_World.jpeg',
  '/covers/Kafka_Metamorphosis.jpg',
  '/covers/Kafka_The_Trial.png',
  '/covers/Kierkegaard_Fear_and_Trembling.jpg',
  '/covers/Leo_Tolstoy_War_and_Peace.jpg',
  '/covers/Machiavelli_The_Prince.jpeg',
  '/covers/Marcus_Aurelius_Meditations.jpeg',
  '/covers/Miguel_de_Cervantes_Don_Quixote.jpeg',
  '/covers/Nietzsche_Beyond_Good_and_Evil.jpg',
  '/covers/Nietzsche_Thus_Spoke_Zarathustra.jpg',
  '/covers/Orwell_1984.jpg',
  '/covers/Plath_The_Bell_Jar.jpeg',
  '/covers/Plato_Symposium.jpeg',
  '/covers/Plato_The_Republic.jpg',
  '/covers/Ray_Bradbury_Fahrenheit_451.jpg',
  '/covers/Steinbeck_East_of_Eden.jpg',
  '/covers/Steinbeck_The_Pearl.jpg',
  '/covers/Sun_Tzu_The_Art_of_War.jpeg',
  '/covers/Tolstoy_Anna_Karenina.jpg',
  '/covers/Wilde_The_Picture_of_Dorian_Gray.jpg',
  '/covers/Woolf_Mrs_Dalloway.jpg'
];

export default function BookCoversCarousel() {
  const [covers, setCovers] = useState(ALL_PROJECT_COVERS);
  const row1Ref = useRef(null);
  const row2Ref = useRef(null);
  const row3Ref = useRef(null);
  const grainRef = useRef(null);

  // Sync custom uploaded user books dynamically while guaranteeing all static covers
  useEffect(() => {
    let isSubscribed = true;

    const loadCovers = async () => {
      try {
        const userBooks = await getAllBooks();
        if (!isSubscribed) return;

        const customCovers = userBooks
          .map(b => b.coverImage)
          .filter(c => c && typeof c === 'string');

        const combined = Array.from(new Set([...customCovers, ...ALL_PROJECT_COVERS]));
        setCovers(combined.length > 0 ? combined : ALL_PROJECT_COVERS);
      } catch (err) {
        if (isSubscribed) setCovers(ALL_PROJECT_COVERS);
      }
    };

    loadCovers();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Organic, Calm, Relaxed Multi-Speed GSAP Marquee Animation + Grain Micro-Animation
  useEffect(() => {
    if (!row1Ref.current || !row2Ref.current || !row3Ref.current) return;

    let ctx = gsap.context(() => {
      // Row 1: Calm, serene leftward drift
      const row1Anim = gsap.to(row1Ref.current, {
        xPercent: -50,
        repeat: -1,
        duration: 72,
        ease: 'none'
      });

      // Row 2: Relaxed, gentle rightward float
      const row2Anim = gsap.fromTo(row2Ref.current,
        { xPercent: -50 },
        {
          xPercent: 0,
          repeat: -1,
          duration: 88,
          ease: 'none'
        }
      );

      // Row 3: Organic, steady leftward drift
      const row3Anim = gsap.to(row3Ref.current, {
        xPercent: -50,
        repeat: -1,
        duration: 64,
        ease: 'none'
      });

      // Gentle Entrance Sweep -> Decelerates down to 1.0x over 3.2s
      row1Anim.timeScale(1.8);
      row2Anim.timeScale(1.8);
      row3Anim.timeScale(1.8);

      gsap.to([row1Anim, row2Anim, row3Anim], {
        timeScale: 1.0,
        duration: 3.2,
        ease: 'power2.out',
        delay: 0.1
      });

      // Filmic Analog Grain Texture Micro-Flicker for Timeless Vibe
      if (grainRef.current) {
        gsap.to(grainRef.current, {
          opacity: 0.08,
          repeat: -1,
          yoyo: true,
          duration: 0.18,
          ease: 'steps(3)'
        });
      }
    });

    return () => ctx.revert();
  }, [covers]);

  // Duplicate stream to guarantee 100% infinite seamless wrapping without gaps
  const coverStream = [...covers, ...covers, ...covers, ...covers];
  const row1Covers = coverStream;
  const row2Covers = [...coverStream].reverse();
  const row3Covers = coverStream;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] z-0 overflow-hidden bg-[#0A0D0C] select-none pointer-events-none">
      
      {/* SVG Grain Noise Filter Definition */}
      <svg className="hidden">
        <filter id="grain-noise-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      {/* 1. Angled Infinite GSAP Sliding Book Cover Cards Marquee Grid */}
      <div 
        className="absolute inset-0 w-[145%] h-[145%] -left-[22%] -top-[22%] flex flex-col justify-center gap-7 opacity-90"
        style={{
          transform: 'rotate(-3.5deg) scale(1.05)',
          transformOrigin: 'center center'
        }}
      >
        {/* Row 1 Stream — Photo Cards Leftward */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row1Ref} className="flex gap-6 min-w-max">
            {row1Covers.map((src, i) => (
              <div 
                key={`r1-${i}`}
                className="relative w-[130px] h-[195px] sm:w-[165px] sm:h-[245px] lg:w-[190px] lg:h-[280px] rounded-xl overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,0.75)] border-2 border-white/20 bg-[#111614] shrink-0"
              >
                <img 
                  src={src} 
                  alt="Book Cover Photo Card" 
                  loading="eager"
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 Stream — Photo Cards Rightward */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row2Ref} className="flex gap-6 min-w-max">
            {row2Covers.map((src, i) => (
              <div 
                key={`r2-${i}`}
                className="relative w-[130px] h-[195px] sm:w-[165px] sm:h-[245px] lg:w-[190px] lg:h-[280px] rounded-xl overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,0.75)] border-2 border-white/20 bg-[#111614] shrink-0"
              >
                <img 
                  src={src} 
                  alt="Book Cover Photo Card" 
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Row 3 Stream — Photo Cards Leftward */}
        <div className="overflow-hidden w-full flex whitespace-nowrap">
          <div ref={row3Ref} className="flex gap-6 min-w-max">
            {row3Covers.map((src, i) => (
              <div 
                key={`r3-${i}`}
                className="relative w-[130px] h-[195px] sm:w-[165px] sm:h-[245px] lg:w-[190px] lg:h-[280px] rounded-xl overflow-hidden shadow-[0_14px_32px_rgba(0,0,0,0.75)] border-2 border-white/20 bg-[#111614] shrink-0"
              >
                <img 
                  src={src} 
                  alt="Book Cover Photo Card" 
                  loading="eager"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Targeted Left-Side Gradient & Blur Scrim for Maximum Text Contrast */}
      <div 
        className="absolute inset-y-0 left-0 w-full lg:w-[62%] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to right, rgba(10, 13, 12, 0.94) 0%, rgba(10, 13, 12, 0.82) 40%, rgba(10, 13, 12, 0.35) 75%, rgba(10, 13, 12, 0) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 55%, rgba(0,0,0,0) 100%)'
        }}
      />

      {/* 3. Filmic Analog Grain Texture Layer Blended with Gradient Blur Position */}
      <div 
        ref={grainRef}
        className="absolute inset-y-0 left-0 w-full lg:w-[62%] pointer-events-none z-15 opacity-[0.05] mix-blend-overlay"
        style={{
          filter: 'url(#grain-noise-filter)',
          maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 100%)'
        }}
      />

      {/* Ambient Canvas Tint */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(10, 13, 12, 0.25) 0%, rgba(10, 13, 12, 0.6) 100%)'
        }}
      />

      {/* Subtle Corner Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          boxShadow: 'inset 0 0 90px rgba(10, 13, 12, 0.6)'
        }}
      />
    </div>
  );
}
