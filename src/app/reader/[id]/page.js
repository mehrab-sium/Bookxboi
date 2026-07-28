'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getBookData, updateReadingProgress } from '../../../lib/libraryStore';
import GlassTooltip from '../../../components/GlassTooltip';
import TextSelectionLayer from '../../../components/TextSelectionLayer';
import { loadPDF, getPDFPageData } from '../../../lib/pdfLoader';

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeBook, setActiveBook] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const selectionTimeoutRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State
  const [readerTheme, setReaderTheme] = useState('canvas'); // 'canvas', 'dark', 'white'
  const [readerFont, setReaderFont] = useState('serif'); // 'serif', 'sans'

  const themeColors = {
    canvas: { background: '#F5F2EB', color: '#1C2321', cardBg: '#FAF8F5', border: 'rgba(28, 35, 33, 0.12)' },
    dark: { background: '#111413', color: '#F5F2EB', cardBg: '#1C2321', border: 'rgba(245, 242, 235, 0.15)' },
    white: { background: '#F9F9FB', color: '#1C2321', cardBg: '#FFFFFF', border: 'rgba(0, 0, 0, 0.08)' }
  };

  const fontFamilies = {
    serif: 'Ogg, Georgia, "Times New Roman", serif',
    sans: 'var(--font-sans), system-ui, sans-serif'
  };

  // PDF states
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [currentPageCanvas, setCurrentPageCanvas] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 540, height: 720 });
  const [textItems, setTextItems] = useState([]);

  // Selection state
  const [selectedWord, setSelectedWord] = useState('');
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectionContext, setSelectionContext] = useState('');

  const triggerAiDictionary = (word, contextText, absoluteX, absoluteY, rectWidth, rectHeight) => {
    setSelectedWord(word);
    setSelectionContext(contextText);
    setSelectionRect({
      left: absoluteX,
      top: absoluteY,
      right: absoluteX + rectWidth,
      bottom: absoluteY + rectHeight,
      width: rectWidth,
      height: rectHeight
    });
  };

  const closeAiDictionary = () => {
    setSelectedWord('');
    setSelectionRect(null);
  };

  // Initialize Book Reader
  useEffect(() => {
    if (!id) return;

    const initBook = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const record = await getBookData(decodedId);
        if (!record) {
          alert('Book not found in library.');
          router.push('/');
          return;
        }
        setActiveBook(record);
        if (record.progressPercent) {
          setProgressPercent(record.progressPercent);
        }

        if (record.type === 'epub') {
          setTimeout(async () => {
            const { default: ePub } = await import('epubjs');
            const book = ePub(record.data);

            if (!viewerRef.current) return;

            // Configure EPUB Rendition for perfect book layout across screen sizes
            const rend = book.renderTo(viewerRef.current, {
              width: '100%',
              height: '100%',
              flow: 'paginated',
              spread: 'auto'
            });

            renditionRef.current = rend;

            // Register Themes
            rend.themes.register('canvas', { "body": { "background": "#FAF8F5 !important", "color": "#1C2321 !important" } });
            rend.themes.register('dark', { "body": { "background": "#1C2321 !important", "color": "#F5F2EB !important" } });
            rend.themes.register('white', { "body": { "background": "#FFFFFF !important", "color": "#1C2321 !important" } });

            // Apply default typography & padding rules
            rend.themes.default({
              "body": {
                "padding": "5% 8% !important",
                "font-family": `${fontFamilies[readerFont]} !important`,
                "line-height": "1.75 !important"
              },
              "p": {
                "font-size": "1.125rem !important",
                "line-height": "1.8 !important",
                "margin-bottom": "1em !important"
              },
              "img, svg": {
                "max-width": "100% !important",
                "max-height": "80vh !important",
                "object-fit": "contain !important"
              }
            });

            // Handle word selection & tap lookup inside EPUB iframe
            rend.on('selected', (cfiRange, contents) => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
              
              selectionTimeoutRef.current = setTimeout(async () => {
                try {
                  const range = await rend.book.getRange(cfiRange);
                  const word = range.toString().trim();
                  if (!word || word.length < 2) return;

                  let contextText = word;
                  if (range.startContainer && range.startContainer.parentNode) {
                    contextText = range.startContainer.parentNode.textContent || word;
                  }

                  const rect = range.getBoundingClientRect();
                  const iframeRect = contents.document.defaultView.frameElement.getBoundingClientRect();
                  const absoluteX = rect.left + iframeRect.left;
                  const absoluteY = rect.top + iframeRect.top;

                  triggerAiDictionary(word, contextText, absoluteX, absoluteY, rect.width, rect.height);
                } catch (e) {
                  console.error('Selection resolution error:', e);
                }
              }, 300);
            });

            rend.on('click', () => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
              closeAiDictionary();
            });

            // Display initial or saved location
            if (record.lastLocation) {
              await rend.display(record.lastLocation);
            } else {
              await rend.display();
            }

            // Track location relocation for progression system
            rend.on('relocated', (location) => {
              closeAiDictionary();
              if (location && location.start) {
                const cfi = location.start.cfi;
                const pct = Math.round((location.start.percentage || 0) * 100);
                setProgressPercent(pct);
                updateReadingProgress(decodedId, pct, cfi);
              }
            });

            // Window resize handler for responsive layout
            const handleResize = () => {
              if (renditionRef.current) {
                renditionRef.current.resize('100%', '100%');
              }
            };
            window.addEventListener('resize', handleResize, { passive: true });

          }, 100);
        } else if (record.type === 'pdf') {
          const doc = await loadPDF(record.data);
          setPdfDoc(doc);
          const startPage = typeof record.lastLocation === 'number' ? record.lastLocation : 1;
          await loadPDFPage(doc, startPage, decodedId);
        }
      } catch (err) {
        console.error('Failed to load book', err);
      }
    };

    initBook();
  }, [id, router]);

  // Handle Theme & Font updates
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(readerTheme);
      renditionRef.current.themes.default({
        "body": {
          "font-family": `${fontFamilies[readerFont]} !important`,
          "padding": "5% 8% !important"
        }
      });
    }
  }, [readerTheme, readerFont]);

  // Keyboard navigation (Left / Right arrow keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePagePrev();
      } else if (e.key === 'ArrowRight') {
        handlePageNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeBook, pdfDoc, pdfCurrentPage]);

  const loadPDFPage = async (doc, pageNum, bookIdOverride = null) => {
    try {
      const pageData = await getPDFPageData(doc, pageNum, 540, 720);
      setTextItems(pageData.textItems);
      setCurrentPageCanvas(pageData.canvas);
      setPageDimensions({ width: pageData.width, height: pageData.height });
      setPdfCurrentPage(pageNum);

      if (doc.numPages) {
        const pct = Math.round((pageNum / doc.numPages) * 100);
        setProgressPercent(pct);
        const targetId = bookIdOverride || activeBook?.id;
        if (targetId) {
          updateReadingProgress(targetId, pct, pageNum);
        }
      }
    } catch (err) {
      console.error('Error loading PDF page:', err);
    }
  };

  const handlePageNext = () => {
    closeAiDictionary();
    if (activeBook?.type === 'epub' && renditionRef.current) {
      renditionRef.current.next();
    } else if (activeBook?.type === 'pdf' && pdfDoc) {
      if (pdfCurrentPage < pdfDoc.numPages) {
        loadPDFPage(pdfDoc, pdfCurrentPage + 1);
      }
    }
  };

  const handlePagePrev = () => {
    closeAiDictionary();
    if (activeBook?.type === 'epub' && renditionRef.current) {
      renditionRef.current.prev();
    } else if (activeBook?.type === 'pdf' && pdfDoc) {
      if (pdfCurrentPage > 1) {
        loadPDFPage(pdfDoc, pdfCurrentPage - 1);
      }
    }
  };

  const fabStyle = {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'absolute',
    zIndex: 50,
    width: '48px',
    height: '48px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    transition: 'transform 0.2s, background 0.2s, color 0.2s'
  };

  const dynamicFabStyle = {
    ...fabStyle,
    color: readerTheme === 'dark' ? '#F5F2EB' : '#1C2321',
    background: readerTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(245, 242, 235, 0.85)',
    border: readerTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(28, 35, 33, 0.12)'
  };

  if (!activeBook) {
    return (
      <div className="min-h-screen bg-canvas-light flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-contrast-midnight)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const currentColors = themeColors[readerTheme];

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: currentColors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Top Reading Progress Indicator Badge & Micro Line */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: 'none'
      }}>
        <div style={{
          background: readerTheme === 'dark' ? 'rgba(28, 35, 33, 0.85)' : 'rgba(245, 242, 235, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '5px 14px',
          borderRadius: '9999px',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 600,
            color: readerTheme === 'dark' ? '#F5F2EB' : '#1C2321'
          }}>
            {progressPercent}% Read
          </span>
        </div>
        <div style={{
          width: '100px',
          height: '3px',
          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #d4af37 0%, #f5f2eb 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Navigation Floating Buttons */}
      <button 
        onClick={() => router.push('/')}
        style={{ ...dynamicFabStyle, top: '20px', left: '20px' }}
        title="Back to Library"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ArrowLeft size={22} />
      </button>

      <button 
        onClick={() => setIsSettingsOpen(true)}
        style={{ ...dynamicFabStyle, top: '20px', right: '20px' }}
        title="Settings"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Settings size={22} />
      </button>

      <button 
        onClick={handlePagePrev}
        style={{ ...dynamicFabStyle, top: '50%', left: '20px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronLeft size={22} />
      </button>

      <button 
        onClick={handlePageNext}
        style={{ ...dynamicFabStyle, top: '50%', right: '20px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronRight size={22} />
      </button>

      {/* Book Canvas Container - Responsive centered book layout */}
      <div 
        style={{
          width: 'min(92vw, 1100px)',
          height: 'min(86vh, 850px)',
          margin: '0 auto',
          position: 'relative',
          borderRadius: '16px',
          background: currentColors.cardBg,
          border: `1px solid ${currentColors.border}`,
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          transition: 'background 0.3s ease, border 0.3s ease'
        }}
      >
        {/* EPUB Viewer Container */}
        {activeBook.type === 'epub' ? (
          <div
            ref={viewerRef}
            style={{
              height: '100%',
              width: '100%',
              position: 'absolute',
              inset: 0
            }}
          />
        ) : null}

        {/* PDF Container */}
        {activeBook.type === 'pdf' ? (
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ 
              width: `${pageDimensions.width}px`, 
              height: `${pageDimensions.height}px`,
              position: 'relative',
              transform: `scale(min(1, calc(90vw / ${pageDimensions.width}), calc(80vh / ${pageDimensions.height})))`,
              transformOrigin: 'center center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              background: 'white'
            }}>
              {currentPageCanvas ? (
                <canvas
                  ref={(el) => {
                    if (el && currentPageCanvas) {
                      el.width = currentPageCanvas.width;
                      el.height = currentPageCanvas.height;
                      const ctx = el.getContext('2d');
                      ctx.drawImage(currentPageCanvas, 0, 0);
                    }
                  }}
                  style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                />
              ) : null}
              <TextSelectionLayer
                textItems={textItems}
                pageWidth={pageDimensions.width}
                pageHeight={pageDimensions.height}
                onSelectionChange={(word, rect, context) => {
                  triggerAiDictionary(word, context, rect.left, rect.top, rect.width, rect.height);
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* GlassTooltip Overlay */}
      {(selectedWord && selectionRect) ? (
        <GlassTooltip 
          word={selectedWord} 
          rect={selectionRect} 
          context={selectionContext} 
          dictionaryLang="both"
          onClose={closeAiDictionary}
        />
      ) : null}

      {/* Settings Modal */}
      {isSettingsOpen ? (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(28, 35, 33, 0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="glass-panel" 
            style={{ 
              padding: '2rem', 
              borderRadius: '1.25rem', 
              background: 'rgba(255, 255, 255, 0.9)', 
              minWidth: '320px',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="text-soul text-2xl text-contrast-midnight m-0">Reader Settings</h3>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(28,35,33,0.5)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="text-core text-contrast-midnight/80 mb-6 space-y-6">
              <div>
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-3 font-semibold">Typography</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setReaderFont('serif')}
                    className="clickable"
                    style={{ 
                      flex: 1, padding: '10px', borderRadius: '8px',
                      background: readerFont === 'serif' ? 'var(--color-contrast-midnight)' : 'transparent',
                      color: readerFont === 'serif' ? 'white' : 'var(--color-contrast-midnight)',
                      border: readerFont === 'serif' ? '1px solid var(--color-contrast-midnight)' : '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    Serif
                  </button>
                  <button 
                    onClick={() => setReaderFont('sans')}
                    className="clickable"
                    style={{ 
                      flex: 1, padding: '10px', borderRadius: '8px',
                      background: readerFont === 'sans' ? 'var(--color-contrast-midnight)' : 'transparent',
                      color: readerFont === 'sans' ? 'white' : 'var(--color-contrast-midnight)',
                      border: readerFont === 'sans' ? '1px solid var(--color-contrast-midnight)' : '1px solid rgba(0,0,0,0.1)'
                    }}
                  >
                    Sans
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-3 font-semibold">Canvas Tone</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div 
                    onClick={() => setReaderTheme('canvas')}
                    style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', background: '#F5F2EB', cursor: 'pointer',
                      border: readerTheme === 'canvas' ? '3px solid var(--color-contrast-sepia)' : '2px solid rgba(0,0,0,0.1)',
                      boxShadow: readerTheme === 'canvas' ? '0 0 0 2px white inset' : 'none'
                    }} 
                  />
                  <div 
                    onClick={() => setReaderTheme('dark')}
                    style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', background: '#1C2321', cursor: 'pointer',
                      border: readerTheme === 'dark' ? '3px solid var(--color-contrast-sepia)' : '2px solid rgba(0,0,0,0.2)',
                      boxShadow: readerTheme === 'dark' ? '0 0 0 2px white inset' : 'none'
                    }} 
                  />
                  <div 
                    onClick={() => setReaderTheme('white')}
                    style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', background: '#FFFFFF', cursor: 'pointer',
                      border: readerTheme === 'white' ? '3px solid var(--color-contrast-sepia)' : '2px solid rgba(0,0,0,0.1)',
                      boxShadow: readerTheme === 'white' ? '0 0 0 2px white inset' : 'none'
                    }} 
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="btn-premium w-full flex justify-center py-3 font-semibold"
              style={{ transition: 'transform 0.2s', marginTop: '16px' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
