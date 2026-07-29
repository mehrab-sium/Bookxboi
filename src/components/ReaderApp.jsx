'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, Trash2, Zap, Bookmark, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { saveBook, getAllBooks, deleteBook } from '../lib/libraryStore';
import { getSetting, setSetting } from '../lib/aiRouter';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Vercel Best Practice: js-hoist-regexp - Hoist RegExp creation outside render loops
const FILE_EXT_REGEX = /\.(pdf|epub)$/i;

function formatBookTitle(name) {
  if (!name) return 'Untitled Volume';
  return name.replace(FILE_EXT_REGEX, '').replace(/_/g, ' ');
}

export default function ReaderApp() {
  const router = useRouter();
  const containerRef = useRef(null);

  // Library States
  const [books, setBooks] = useState([]);
  const [loadingBook, setLoadingBook] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [booksLoaded, setBooksLoaded] = useState(false);

  // Settings & Keys
  const [geminiKey, setGeminiKey] = useState('');

  // DOM Refs
  const fileInputRef = useRef(null);

  const refreshLibrary = async () => {
    const list = await getAllBooks();
    setBooks(list);
    setBooksLoaded(true);
  };

  const loadSettings = async () => {
    const key = await getSetting('gemini_api_key');
    if (key) setGeminiKey(key);
  };

  // Vercel Best Practice: async-parallel - Run independent initial fetches in parallel
  useEffect(() => {
    Promise.all([refreshLibrary(), loadSettings()]);
  }, []);

  // GSAP ScrollTrigger Entrance & Cascade Animations
  useEffect(() => {
    if (booksLoaded && containerRef.current) {
      let ctx = gsap.context(() => {
        gsap.fromTo('.archive-header-anim',
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.0,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        gsap.fromTo('.book-card-anim', 
          { y: 60, opacity: 0, scale: 0.95 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            duration: 0.9, 
            stagger: 0.06, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );

        gsap.fromTo('.upload-zone', 
          { scale: 0.9, opacity: 0 },
          { 
            scale: 1, 
            opacity: 1, 
            duration: 0.9, 
            ease: 'power3.out',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [booksLoaded]);

  // Vercel Best Practice: bundle-dynamic-imports - Extract cover from EPUB using dynamic import
  const extractEpubCover = async (arrayBuffer) => {
    try {
      const { default: ePub } = await import('epubjs');
      const book = ePub(arrayBuffer);
      await book.ready;
      const coverUrl = await book.coverUrl();
      if (coverUrl) {
        const response = await fetch(coverUrl);
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result); // Base64 Data URL
          reader.readAsDataURL(blob);
        });
      }
      return null;
    } catch (e) {
      console.error('Failed to extract EPUB cover:', e);
      return null;
    }
  };

  // Upload/Ingestion Handlers
  const processFile = async (file) => {
    if (!file) return;
    const type = file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.epub') ? 'epub' : null;
    if (!type) {
      alert('Only PDF and EPUB files are supported currently.');
      return;
    }

    setLoadingBook(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let coverImage = null;

      if (type === 'epub') {
        const bufferClone = arrayBuffer.slice(0);
        coverImage = await extractEpubCover(bufferClone);
      }

      await saveBook(file.name, type, arrayBuffer, coverImage);
      await refreshLibrary();
      
      // Vercel Best Practice: bundle-dynamic-imports - Dynamically import heavy UI effect libraries
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f5f2eb', '#111413']
      });
    } catch (err) {
      console.error('Error loading file:', err);
      alert('Failed to parse and store the book file.');
    } finally {
      setLoadingBook(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDeleteBook = async (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this book from your local storage?')) {
      await deleteBook(id);
      await refreshLibrary();
    }
  };

  const handleOpenBook = (bookInfo) => {
    router.push(`/reader/${encodeURIComponent(bookInfo.id)}`);
  };

  return (
    <section id="archive" ref={containerRef} className="max-w-screen-2xl mx-auto px-6 lg:px-12 w-full pt-28 pb-32 min-h-screen relative z-10 pointer-events-auto">
      
      {/* Archive Header Section — Neo Minimal & Soft Brutalist Editorial Layout */}
      <div className="archive-header-anim opacity-0 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-[#111111] pb-8">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#E87034] font-bold mb-2 block">
            VOL. 01 // PUBLIC & PERSONAL TREASURY
          </span>
          <h2 className="text-soul text-4xl sm:text-5xl text-[#111111] font-serif font-bold tracking-tight">The Archive</h2>
        </div>
        <p className="font-mono text-xs sm:text-sm text-[#111111]/80 max-w-md leading-relaxed">
          Explore built-in masterpiece volumes or archivize custom EPUB & PDF texts into your browser library.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
        
        {/* Upload Card (First Slot) — Soft Brutalist Card */}
        <div 
          className={`upload-zone opacity-0 group relative w-full aspect-[2/3] brutal-card flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${dragOver ? 'border-[#E87034] bg-[#E87034]/20 shadow-[6px_6px_0px_#111111]' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 border-2 border-[#111111] bg-[#E87034] text-[#111111] flex items-center justify-center mb-4 shadow-[2px_2px_0px_#111111] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px]">
            <Upload size={20} strokeWidth={2.5} />
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-[#111111] mb-2">Archivize Text</div>
          <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#111111]/70">Drag & Drop EPUB / PDF</div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }}
            onChange={(e) => processFile(e.target.files[0])}
            accept=".pdf,.epub"
          />
        </div>

        {/* User & Masterpiece Library Books */}
        {books.map((book) => {
          let hash = 0;
          for (let i = 0; i < book.name.length; i++) {
            hash = book.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash) % 360;
          const coverGradient = `linear-gradient(135deg, hsl(${hue}, 40%, 18%), hsl(${(hue + 45) % 360}, 55%, 28%))`;
          
          const progress = book.progressPercent || 0;
          const isCompleted = progress >= 100;
          const isStarted = progress > 0 && progress < 100;

          return (
            <div 
              key={book.id} 
              className="book-card-anim opacity-0 group relative w-full aspect-[2/3] cursor-pointer transition-all duration-300 border-2 border-[#111111] shadow-[4px_4px_0px_#111111] hover:translate-x-[-3px] hover:translate-y-[-3px] hover:shadow-[7px_7px_0px_#111111] overflow-hidden"
              style={{ background: book.coverImage ? '#111413' : coverGradient }}
              onClick={() => handleOpenBook(book)}
            >
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                />
              ) : null}

              {/* Reading Progress Top Pill Badge — Soft Brutalist Badge */}
              <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-1 ${
                  isCompleted 
                    ? 'bg-emerald-400 text-[#111111]' 
                    : isStarted 
                      ? 'bg-[#E87034] text-[#111111]' 
                      : 'bg-[#F7F4EF] text-[#111111]'
                }`}>
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={10} strokeWidth={2.5} /> Finished
                    </>
                  ) : isStarted ? (
                    <>
                      <Bookmark size={10} strokeWidth={2.5} /> {progress}% Read
                    </>
                  ) : (
                    'Unread'
                  )}
                </span>
              </div>
              
              {/* Card Footer Overlay with Clean Title & Author */}
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                <div className="font-serif text-base sm:text-lg text-canvas-light leading-snug drop-shadow-md line-clamp-2 break-words font-semibold">
                  {formatBookTitle(book.name)}
                </div>
                
                {book.author ? (
                  <div className="font-sans text-[11px] text-canvas-light/80 font-normal italic mt-0.5 line-clamp-1">
                    {book.author}
                  </div>
                ) : null}

                <div className="font-mono text-[9px] uppercase tracking-widest text-[#E87034] font-bold mt-2 flex items-center justify-between">
                  <span>{book.type.toUpperCase()}</span>
                  <span>{isStarted ? `${progress}%` : isCompleted ? '100%' : 'Unread'}</span>
                </div>

                {/* Micro Progress Bar Line */}
                <div className="w-full h-1.5 bg-white/20 border border-black mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-[#E87034]'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
              
              {/* Delete Action (User Uploaded Books Only) */}
              {!book.id.startsWith('pub-') && book.id !== 'sample-pdf' ? (
                <button 
                  className="absolute top-2.5 right-2.5 text-canvas-light bg-red-600 border border-black p-1 z-20 hover:scale-110 transition-transform shadow-[2px_2px_0px_#111111]"
                  onClick={(e) => handleDeleteBook(e, book.id)}
                  title="Delete from local library"
                >
                  <Trash2 size={12} strokeWidth={2.5} />
                </button>
              ) : null}
              
              {/* Hover Action Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 pointer-events-none bg-black/40 backdrop-blur-[2px]">
                <span className="font-mono text-xs uppercase tracking-widest text-[#111111] bg-[#F7F4EF] border-2 border-[#111111] px-4 py-2 font-bold shadow-[4px_4px_0px_#E87034]">
                  {isStarted ? `Resume (${progress}%)` : isCompleted ? 'Read Again' : 'Read ↵'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {loadingBook ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-contrast-midnight/50" style={{ backdropFilter: 'blur(12px)' }}>
          <div className="glass-panel-thick rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-soul text-2xl text-[#d4af37] mb-4">Parsing Volume...</div>
            <div className="spinner" style={{ margin: '0 auto', width: '28px', height: '28px', border: '2px solid rgba(212,175,55,0.2)', borderTop: '2px solid #d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
