'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getBookData, updateReadingProgress } from '../../../lib/libraryStore';
import GlassTooltip from '../../../components/GlassTooltip';
import TextSelectionLayer from '../../../components/TextSelectionLayer';
import { loadPDF, getPDFPageData } from '../../../lib/pdfLoader';

// Helper: Caret point resolution (Zero DOM Bloat Word Lookup with Debug Error Logging)
function getWordFromPoint(doc, x, y) {
  try {
    let range = null;
    try {
      if (doc.caretRangeFromPoint) {
        range = doc.caretRangeFromPoint(x, y);
      } else if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y);
        if (pos) {
          range = doc.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
    } catch (caretErr) {
      console.error('[DEBUG caretRangeFromPoint Error]:', caretErr);
    }

    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const textNode = range.startContainer;
    const offset = range.startOffset;
    const text = textNode.textContent;
    if (!text) return null;

    // Expand outwards to extract word boundary
    let start = offset;
    while (start > 0 && /[\w\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]/.test(text[start - 1])) {
      start--;
    }
    let end = offset;
    while (end < text.length && /[\w\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]/.test(text[end])) {
      end++;
    }

    const word = text.slice(start, end).trim();
    if (!word || word.length < 2) return null;

    const wordRange = doc.createRange();
    wordRange.setStart(textNode, start);
    wordRange.setEnd(textNode, end);
    const rect = wordRange.getBoundingClientRect();

    return {
      word,
      context: text.trim(),
      rect
    };
  } catch (e) {
    console.error('[DEBUG getWordFromPoint Outer Exception]:', e);
    return null;
  }
}

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeBook, setActiveBook] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const resizeObserverRef = useRef(null);

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
    serif: 'Ogg, var(--font-display), Georgia, serif',
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

            // Configure EPUB Rendition with CSS Multi-Column Pagination
            const rend = book.renderTo(viewerRef.current, {
              width: '100%',
              height: '100%',
              flow: 'paginated',
              manager: 'default',
              spread: 'none'
            });

            renditionRef.current = rend;

            // Apply Themes
            rend.themes.register('canvas', { "body": { "background": "#F5F2EB !important", "color": "#1C2321 !important" } });
            rend.themes.register('dark', { "body": { "background": "#1C2321 !important", "color": "#F5F2EB !important" } });
            rend.themes.register('white', { "body": { "background": "#FFFFFF !important", "color": "#1C2321 !important" } });

            // Inject CSS Multi-Column & Typography Rules
            rend.hooks.content.register((contents) => {
              const doc = contents.document;
              if (!doc) return;

              doc.documentElement.setAttribute('lang', record.lang || 'en');

              // DEBUG (1): Calculate total page count from scrollWidth / clientWidth
              setTimeout(() => {
                const bodyScrollWidth = doc.body ? doc.body.scrollWidth : 0;
                const htmlScrollWidth = doc.documentElement ? doc.documentElement.scrollWidth : 0;
                const bodyClientWidth = doc.body ? doc.body.clientWidth : 0;
                const htmlClientWidth = doc.documentElement ? doc.documentElement.clientWidth : 0;

                const effectiveScrollWidth = Math.max(bodyScrollWidth, htmlScrollWidth);
                const effectiveClientWidth = htmlClientWidth || bodyClientWidth || 1;
                const computedPages = Math.ceil(effectiveScrollWidth / effectiveClientWidth);

                console.log('[DEBUG (1) PageCount Calculation]', {
                  bodyScrollWidth,
                  htmlScrollWidth,
                  bodyClientWidth,
                  htmlClientWidth,
                  effectiveScrollWidth,
                  effectiveClientWidth,
                  computedPages
                });
              }, 300);

              contents.addStylesheetRules({
                'html, body': {
                  'height': '100dvh !important',
                  'margin': '0 !important',
                  'padding': '0 !important',
                  'overflow': 'hidden !important',
                  '-webkit-font-smoothing': 'antialiased'
                },
                'body': {
                  'column-width': '100vw !important',
                  'column-gap': '0px !important',
                  'column-fill': 'auto !important',
                  'padding': '4vh min(6vw, 60px) !important',
                  'box-sizing': 'border-box !important',
                  'hyphens': 'auto !important',
                  '-webkit-hyphens': 'auto !important',
                  '-ms-hyphens': 'auto !important',
                  'orphans': '2 !important',
                  'widows': '2 !important'
                },
                'p, article, section, div, h1, h2, h3, h4': {
                  'max-width': '65ch !important',
                  'margin-inline': 'auto !important',
                  'line-height': '1.8 !important',
                  'orphans': '2 !important',
                  'widows': '2 !important'
                },
                'p': {
                  'margin-bottom': '1.25em !important'
                },
                'img, svg, video': {
                  'max-width': '100% !important',
                  'max-height': '80vh !important',
                  'object-fit': 'contain !important',
                  'margin-inline': 'auto !important',
                  'display': 'block !important'
                }
              });

              // Zero-DOM-Bloat Word Lookup on Tap / Click
              doc.addEventListener('click', (e) => {
                const width = doc.defaultView?.innerWidth || window.innerWidth;
                const clickX = e.clientX;

                // Tap navigation zones (left 20% prev, right 20% next)
                if (clickX < width * 0.2) {
                  closeAiDictionary();
                  rend.prev();
                  return;
                }
                if (clickX > width * 0.8) {
                  closeAiDictionary();
                  rend.next();
                  return;
                }

                // Caret resolution from raw text nodes
                const res = getWordFromPoint(doc, e.clientX, e.clientY);
                if (res) {
                  const iframeRect = doc.defaultView.frameElement.getBoundingClientRect();
                  const absX = res.rect.left + iframeRect.left;
                  const absY = res.rect.top + iframeRect.top;
                  triggerAiDictionary(res.word, res.context, absX, absY, res.rect.width, res.rect.height);
                } else {
                  closeAiDictionary();
                }
              });
            });

            // Display initial or saved location
            if (record.lastLocation) {
              await rend.display(record.lastLocation);
            } else {
              await rend.display();
            }

            // Track location relocation
            rend.on('relocated', (location) => {
              closeAiDictionary();
              console.log('[DEBUG Relocated Location]', {
                location,
                startCfi: location?.start?.cfi,
                percentage: location?.start?.percentage,
                atStart: location?.atStart,
                atEnd: location?.atEnd
              });
              if (location && location.start) {
                const cfi = location.start.cfi;
                const pct = Math.round((location.start.percentage || 0) * 100);
                setProgressPercent(pct);
                updateReadingProgress(decodedId, pct, cfi);
              }
            });

            // DEBUG (2): ResizeObserver with firing counter
            let resizeCallCount = 0;
            if (viewerRef.current) {
              const observer = new ResizeObserver((entries) => {
                resizeCallCount++;
                console.log(`[DEBUG (2) ResizeObserver Call #${resizeCallCount}]`, {
                  targetWidth: entries[0]?.contentRect?.width,
                  targetHeight: entries[0]?.contentRect?.height
                });
                if (renditionRef.current) {
                  renditionRef.current.resize('100%', '100%');
                }
              });
              observer.observe(viewerRef.current);
              resizeObserverRef.current = observer;
            }
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

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [id, router]);

  // Handle Theme & Font updates
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(readerTheme);
      renditionRef.current.themes.default({
        "body": {
          "font-family": `${fontFamilies[readerFont]} !important`,
          "padding": "4vh min(6vw, 60px) !important"
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
      console.log('[DEBUG Action]: handlePageNext called');
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
      console.log('[DEBUG Action]: handlePagePrev called');
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
    background: readerTheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(245, 242, 235, 0.75)',
    border: readerTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(28, 35, 33, 0.12)'
  };

  if (!activeBook) {
    return (
      <div className="min-h-[100dvh] bg-canvas-light flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-contrast-midnight)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100dvh', width: '100vw', position: 'relative', overflow: 'hidden', background: themeColors[readerTheme].background }}>
      
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

      {/* Multi-Column CSS EPUB Container */}
      {activeBook.type === 'epub' ? (
        <div
          ref={viewerRef}
          style={{
            height: '100dvh',
            width: '100vw',
            position: 'absolute',
            inset: 0,
            overflow: 'hidden'
          }}
        />
      ) : null}

      {/* PDF Container */}
      {activeBook.type === 'pdf' ? (
        <div style={{ width: '100vw', height: '100dvh', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ 
            width: `${pageDimensions.width}px`, 
            height: `${pageDimensions.height}px`,
            position: 'relative',
            transform: `scale(min(1, calc(100vw / ${pageDimensions.width + 80}), calc(100dvh / ${pageDimensions.height + 120})))`,
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
