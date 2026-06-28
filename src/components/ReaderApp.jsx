'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, Trash2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import ePub from 'epubjs';
import gsap from 'gsap';

import { saveBook, getAllBooks, deleteBook } from '../lib/libraryStore';
import { getSetting, setSetting } from '../lib/aiRouter';

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

  useEffect(() => {
    refreshLibrary();
    loadSettings();
  }, []);

  // GSAP Entrance Animation
  useLayoutEffect(() => {
    if (booksLoaded) {
      let ctx = gsap.context(() => {
        gsap.fromTo('.book-card-anim', 
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.2)' }
        );
        gsap.fromTo('.upload-zone', 
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8, ease: 'power3.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [booksLoaded]);

  // Extract Cover from EPUB
  const extractEpubCover = async (arrayBuffer) => {
    try {
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
        // Clone buffer because epubjs might mutate/consume it depending on internals
        const bufferClone = arrayBuffer.slice(0);
        coverImage = await extractEpubCover(bufferClone);
      }

      await saveBook(file.name, type, arrayBuffer, coverImage);
      await refreshLibrary();
      
      confetti({
        particleCount: 100,
        spread: 70,
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

  const handleOpenBook = async (bookInfo) => {
    if (bookInfo.id === 'sample-pdf' || bookInfo.id === 'sample-epub') {
      alert('Sample books are not stored in IndexedDB. Please upload a real file.');
      return;
    }
    router.push(`/reader/${encodeURIComponent(bookInfo.id)}`);
  };

  return (
    <div ref={containerRef} className="max-w-screen-2xl mx-auto px-8 w-full pt-32 pb-24 min-h-screen relative z-10 pointer-events-auto">
      <h2 className="text-soul text-4xl mb-12 border-b border-contrast-midnight/10 pb-6">The Archive</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {/* Upload Card (First Slot) */}
        <div 
          className={`upload-zone opacity-0 group relative w-full aspect-[2/3] glass-panel flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-500 hover:scale-[1.03] ${dragOver ? 'border-[#d4af37] bg-[#d4af37]/10' : ''}`}
          style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-soul text-2xl text-contrast-midnight mb-4">Archivize a New Text.</div>
          <div className="text-core text-[11px] uppercase tracking-widest text-contrast-midnight/60">PDF / EPUB</div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }}
            onChange={(e) => processFile(e.target.files[0])}
            accept=".pdf,.epub"
          />
        </div>

        {/* User Library Books */}
        {books.map((book, index) => {
          let hash = 0;
          for (let i = 0; i < book.name.length; i++) {
            hash = book.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash) % 360;
          const coverGradient = `linear-gradient(135deg, hsl(${hue}, 40%, 20%), hsl(${(hue + 40) % 360}, 50%, 30%))`;
          
          return (
            <div 
              key={book.id} 
              className="book-card-anim opacity-0 group relative w-full aspect-[2/3] cursor-pointer transition-transform duration-500 hover:scale-[1.03] overflow-hidden"
              style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', background: book.coverImage ? '#111413' : coverGradient }}
              onClick={() => handleOpenBook(book)}
            >
              {book.coverImage && (
                <img 
                  src={book.coverImage} 
                  alt={book.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
              
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="text-soul text-xl text-canvas-light leading-tight drop-shadow-md line-clamp-3">
                  {book.name.replace(/\.(pdf|epub)$/i, '')}
                </div>
                <div className="text-core text-[10px] uppercase tracking-widest text-canvas-light/70 mt-2">
                  {book.type.toUpperCase()} Format
                </div>
              </div>
              
              <button 
                className="absolute top-4 right-4 text-canvas-light/50 hover:text-red-400 transition-colors z-20"
                onClick={(e) => handleDeleteBook(e, book.id)}
              >
                <Trash2 size={16} />
              </button>
              
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center z-10 pointer-events-none bg-black/20 backdrop-blur-[2px]">
                <span className="text-core text-xs uppercase tracking-widest text-contrast-midnight bg-canvas-light/95 px-6 py-2 rounded-full shadow-lg">Read</span>
              </div>
            </div>
          );
        })}
      </div>

      {loadingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-contrast-midnight/40" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel-thick rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-soul text-2xl text-[#d4af37] mb-4">Parsing Volume...</div>
            <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px', border: '2px solid rgba(212,175,55,0.2)', borderTop: '2px solid #d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
