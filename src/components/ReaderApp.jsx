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
      
      {/* Archive Header Section */}
      <div className="archive-header-anim opacity-0 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-contrast-midnight/15 pb-8">
        <div>
          <span className="text-core text-[11px] uppercase tracking-[0.25em] text-[#d4af37] font-semibold mb-2 block">
            Online Public & Personal Treasury
          </span>
          <h2 className="text-soul text-4xl sm:text-5xl text-contrast-midnight">The Archive</h2>
        </div>
        <p className="text-core text-xs sm:text-sm text-contrast-midnight/70 max-w-md leading-relaxed">
          Explore built-in masterpiece EPUBs or archivize new volumes. Your reading progress is saved automatically across all browsing sessions.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
        
        {/* Upload Card (First Slot) */}
        <div 
          className={`upload-zone opacity-0 group relative w-full aspect-[2/3] glass-panel flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-500 hover:scale-[1.03] ${dragOver ? 'border-[#d4af37] bg-[#d4af37]/10' : ''}`}
          style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-12 h-12 rounded-full border border-contrast-midnight/20 flex items-center justify-center mb-4 group-hover:border-[#d4af37] transition-colors">
            <Upload size={20} className="text-contrast-midnight group-hover:text-[#d4af37] transition-colors" />
          </div>
          <div className="text-soul text-xl sm:text-2xl text-contrast-midnight mb-2">Archivize Text</div>
          <div className="text-core text-[10px] uppercase tracking-widest text-contrast-midnight/60">Drag & Drop EPUB / PDF</div>
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
              className="book-card-anim opacity-0 group relative w-full aspect-[2/3] cursor-pointer transition-all duration-500 hover:scale-[1.03] overflow-hidden rounded-xl"
              style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)', background: book.coverImage ? '#111413' : coverGradient }}
              onClick={() => handleOpenBook(book)}
            >
              {book.coverImage ? (
                <img 
                  src={book.coverImage} 
                  alt={book.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                />
              ) : null}

              {/* Reading Progress Top Pill Badge */}
              <div className="absolute top-3 left-3 z-20 pointer-events-none">
                <span className={`text-[10px] font-sans font-semibold tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border shadow-md flex items-center gap-1 ${
                  isCompleted 
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
                    : isStarted 
                      ? 'bg-[#1c2321]/90 text-[#d4af37] border-[#d4af37]/50' 
                      : 'bg-black/60 text-canvas-light/70 border-white/15'
                }`}>
                  {isCompleted ? (
                    <>
                      <CheckCircle2 size={10} /> Finished
                    </>
                  ) : isStarted ? (
                    <>
                      <Bookmark size={10} /> {progress}% Read
                    </>
                  ) : (
                    'Unread'
                  )}
                </span>
              </div>
              
              {/* Card Footer Overlay with Clean Title & Author */}
              <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                <div className="text-soul text-base sm:text-lg text-canvas-light leading-snug drop-shadow-md line-clamp-2 break-words">
                  {formatBookTitle(book.name)}
                </div>
                
                {book.author ? (
                  <div className="text-core text-[11px] text-canvas-light/70 font-normal italic mt-0.5 line-clamp-1">
                    {book.author}
                  </div>
                ) : null}

                <div className="text-core text-[9px] uppercase tracking-widest text-[#d4af37] font-semibold mt-2 flex items-center justify-between">
                  <span>{book.type.toUpperCase()}</span>
                  <span>{isStarted ? `${progress}%` : isCompleted ? '100%' : 'Unread'}</span>
                </div>

                {/* Micro Progress Bar Line */}
                <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#d4af37] to-[#f5f2eb]'}`} 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
              </div>
              
              {/* Delete Action (User Uploaded Books Only) */}
              {!book.id.startsWith('pub-') && book.id !== 'sample-pdf' ? (
                <button 
                  className="absolute top-3 right-3 text-canvas-light/60 hover:text-red-400 transition-colors z-20 p-1.5 rounded-full hover:bg-black/50"
                  onClick={(e) => handleDeleteBook(e, book.id)}
                  title="Delete from local library"
                >
                  <Trash2 size={14} />
                </button>
              ) : null}
              
              {/* Hover Action Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-10 pointer-events-none bg-black/35 backdrop-blur-[2px]">
                <span className="text-core text-xs uppercase tracking-widest text-contrast-midnight bg-canvas-light/95 px-5 py-2.5 rounded-full shadow-2xl font-semibold">
                  {isStarted ? `Resume (${progress}%)` : isCompleted ? 'Read Again' : 'Read'}
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
