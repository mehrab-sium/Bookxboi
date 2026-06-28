const fs = require('fs');
const content = `
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, Trash2, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

import { saveBook, getAllBooks, deleteBook } from '../lib/libraryStore';
import { getSetting, setSetting } from '../lib/aiRouter';

export default function ReaderApp() {
  const router = useRouter();

  // Library States
  const [books, setBooks] = useState([]);
  const [loadingBook, setLoadingBook] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Settings & Keys
  const [geminiKey, setGeminiKey] = useState('');

  // DOM Refs
  const fileInputRef = useRef(null);

  const refreshLibrary = async () => {
    const list = await getAllBooks();
    setBooks(list);
  };

  const loadSettings = async () => {
    const key = await getSetting('gemini_api_key');
    if (key) setGeminiKey(key);
  };

  useEffect(() => {
    refreshLibrary();
    loadSettings();
  }, []);

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
      await saveBook(file.name, type, arrayBuffer);
      await refreshLibrary();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
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
    router.push(\`/reader/\${encodeURIComponent(bookInfo.id)}\`);
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-8 w-full pt-32 pb-24 overflow-y-auto min-h-screen">
      <h2 className="text-soul text-4xl mb-12 border-b border-contrast-midnight/10 pb-6">The Archive</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {/* Upload Card (First Slot) */}
        <div 
          className="upload-zone group relative w-full aspect-[2/3] glass-panel flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-transform duration-500 hover:scale-[1.03]"
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
        {books.map(book => {
          let hash = 0;
          for (let i = 0; i < book.name.length; i++) {
            hash = book.name.charCodeAt(i) + ((hash << 5) - hash);
          }
          const hue = Math.abs(hash) % 360;
          const coverGradient = \`linear-gradient(135deg, hsl(\${hue}, 40%, 20%), hsl(\${(hue + 40) % 360}, 50%, 30%))\`;
          
          return (
            <div 
              key={book.id} 
              className="book-card group relative w-full aspect-[2/3] cursor-pointer transition-transform duration-500 hover:scale-[1.03]"
              style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', background: coverGradient }}
              onClick={() => handleOpenBook(book)}
            >
              <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent">
                <div className="text-soul text-xl text-canvas-light leading-tight">{book.name.replace(/\\.(pdf|epub)$/i, '')}</div>
                <div className="text-core text-[10px] uppercase tracking-widest text-canvas-light/70 mt-2">{book.type.toUpperCase()} Format</div>
              </div>
              <button 
                className="absolute top-4 right-4 text-canvas-light/50 hover:text-red-400 transition-colors z-20"
                onClick={(e) => handleDeleteBook(e, book.id)}
              >
                <Trash2 size={16} />
              </button>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 glass-panel flex items-center justify-center z-10 pointer-events-none">
                <span className="text-core text-xs uppercase tracking-widest text-contrast-midnight bg-canvas-light/90 px-6 py-2 rounded-full">Read</span>
              </div>
            </div>
          );
        })}
      </div>

      {loadingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-contrast-midnight/20" style={{ backdropFilter: 'blur(10px)' }}>
          <div className="glass-panel-thick rounded-xl p-8 max-w-sm w-full text-center">
            <div className="text-soul text-2xl text-canvas-light mb-4">Opening Archive...</div>
            <div className="spinner" style={{ margin: '0 auto', width: '24px', height: '24px', border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/ReaderApp.jsx', content, 'utf8');
console.log('ReaderApp.jsx written.');
