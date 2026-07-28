
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
    canvas: { background: '#F5F2EB', color: '#1C2321' },
    dark: { background: '#1C2321', color: '#F5F2EB' },
    white: { background: '#FFFFFF', color: '#1C2321' }
  };
  
  const fontFamilies = {
    serif: 'Ogg, var(--font-display), serif',
    sans: 'var(--font-sans), sans-serif'
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

  useEffect(() => {
    if (!id) return;
    
    const initBook = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const record = await getBookData(decodedId);
        if (!record) {
          alert('Book not found in local library.');
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

            const rend = book.renderTo(viewerRef.current, {
              width: '100%',
              height: '100%',
              spread: 'none'
            });

            // Register Themes
            rend.themes.register('canvas', { "body": { "background": "#F5F2EB !important", "color": "#1C2321 !important" }});
            rend.themes.register('dark', { "body": { "background": "#1C2321 !important", "color": "#F5F2EB !important" }});
            rend.themes.register('white', { "body": { "background": "#FFFFFF !important", "color": "#1C2321 !important" }});

            // Apply base styling
            rend.themes.default({
              "body": { 
                "padding": "0 10% !important" 
              },
              "p": { 
                "font-size": "1.15rem !important", 
                "line-height": "1.8 !important" 
              }
            });

            // Restore last location if saved
            if (record.lastLocation) {
              rend.display(record.lastLocation);
            } else {
              rend.display();
            }

            // Track location changes and update reading progress percentage
            rend.on('relocated', (location) => {
              if (location && location.start) {
                const cfi = location.start.cfi;
                const pct = Math.round((location.start.percentage || 0) * 100);
                setProgressPercent(pct);
                updateReadingProgress(decodedId, pct, cfi);
              }
            });

            rend.on('selected', (cfiRange, contents) => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
              
              selectionTimeoutRef.current = setTimeout(async () => {
                const range = await rend.book.getRange(cfiRange);
                const word = range.toString().trim();
                
                if (!word) return;

                let contextText = word;
                if (range.startContainer && range.startContainer.parentNode) {
                  contextText = range.startContainer.parentNode.textContent || word;
                }
                
                const rect = range.getBoundingClientRect();
                const iframeRect = contents.document.defaultView.frameElement.getBoundingClientRect();
                
                const absoluteX = rect.left + iframeRect.left;
                const absoluteY = rect.top + iframeRect.top;

                triggerAiDictionary(word, contextText, absoluteX, absoluteY, rect.width, rect.height);
                
              }, 500); 
            });

            rend.on('click', () => {
               if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
               closeAiDictionary();
            });

            renditionRef.current = rend;
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

  // Effect to apply theme and font changes
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(readerTheme);
      renditionRef.current.themes.default({
        "body": { 
          "font-family": `${fontFamilies[readerFont]} !important`,
          "padding": "0 10% !important" 
        }
      });
    }
  }, [readerTheme, readerFont]);

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
        const targetId = bookIdOverride || (activeBook?.id);
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
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--color-contrast-midnight)',
    position: 'absolute',
    zIndex: 50,
    width: '48px',
    height: '48px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, background 0.2s, color 0.2s'
  };

  // Dynamic inverted fab styling for dark theme readability
  const dynamicFabStyle = {
    ...fabStyle,
    color: readerTheme === 'dark' ? '#F5F2EB' : 'var(--color-contrast-midnight)',
    background: readerTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'
  };

  if (!activeBook) {
    return (
      <div className="min-h-screen bg-canvas-light flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-contrast-midnight)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', background: themeColors[readerTheme].background }}>
      
      {/* Top Reading Progress Indicator Badge & Micro Line */}
      <div style={{
        position: 'absolute',
        top: '24px',
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
          background: readerTheme === 'dark' ? 'rgba(28, 35, 33, 0.75)' : 'rgba(245, 242, 235, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '5px 14px',
          borderRadius: '9999px',
          border: '1px solid rgba(212, 175, 55, 0.35)',
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
          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
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

      {/* Floating Action Buttons */}
      <button 
        onClick={() => router.push('/')}
        style={{ ...dynamicFabStyle, top: '24px', left: '24px' }}
        title="Back to Library"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ArrowLeft size={24} />
      </button>

      <button 
        onClick={() => setIsSettingsOpen(true)}
        style={{ ...dynamicFabStyle, top: '24px', right: '24px' }}
        title="Settings"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Settings size={24} />
      </button>

      <button 
        onClick={handlePagePrev}
        style={{ ...dynamicFabStyle, top: '50%', left: '24px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={handlePageNext}
        style={{ ...dynamicFabStyle, top: '50%', right: '24px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronRight size={24} />
      </button>

      {/* Reader Containers */}
      {activeBook.type === 'epub' ? (
        <div
          ref={viewerRef}
          style={{
            height: '100vh',
            width: '100%',
            position: 'absolute',
            inset: 0
          }}
        />
      ) : null}

      {activeBook.type === 'pdf' ? (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: `${pageDimensions.width}px`, 
            height: `${pageDimensions.height}px`,
            position: 'relative',
            transform: `scale(min(1, calc(100vw / ${pageDimensions.width + 100}), calc(100vh / ${pageDimensions.height + 150})))`,
            transformOrigin: 'center center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
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
            background: 'rgba(28, 35, 33, 0.4)',
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
              borderRadius: '1rem', 
              background: 'rgba(255, 255, 255, 0.85)', 
              minWidth: '320px',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)'
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
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-3">Typography</label>
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
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-3">Canvas Tone</label>
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
              className="btn-premium w-full flex justify-center py-3"
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
