'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Type, 
  Sliders, 
  Sun, 
  Moon, 
  Feather, 
  Minus, 
  Plus, 
  RotateCcw, 
  Check, 
  BookOpen,
  AlignLeft
} from 'lucide-react';
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
  const bookRef = useRef(null);
  const selectionTimeoutRef = useRef(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings State (Persisted in localStorage)
  const [readerTheme, setReaderTheme] = useState('canvas');
  const [readerFont, setReaderFont] = useState('garamond');
  const [fontSizePercent, setFontSizePercent] = useState(50); // 0% = 12px / 75%, 50% = 18px / 100%, 100% = 28px / 155%
  const [lineHeight, setLineHeight] = useState(1.75);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('bookxboi_theme');
      const savedFont = localStorage.getItem('bookxboi_font');
      const savedSize = localStorage.getItem('bookxboi_size');
      const savedLineHeight = localStorage.getItem('bookxboi_lineheight');

      if (savedTheme) setReaderTheme(savedTheme);
      if (savedFont && fontCatalog[savedFont]) setReaderFont(savedFont);
      if (savedSize) setFontSizePercent(Number(savedSize));
      if (savedLineHeight) setLineHeight(Number(savedLineHeight));
    } catch (e) {}
  }, []);

  // Save preferences
  const updateSetting = (key, value, setter) => {
    setter(value);
    try {
      localStorage.setItem(`bookxboi_${key}`, value);
    } catch (e) {}
  };

  // Theme Tones Catalog
  const themeColors = {
    canvas: { name: 'Sepia Canvas', background: '#F5F2EB', color: '#1C2321', cardBg: '#FAF8F5', border: 'rgba(28, 35, 33, 0.12)' },
    dark: { name: 'Charcoal', background: '#111413', color: '#F5F2EB', cardBg: '#1C2321', border: 'rgba(245, 242, 235, 0.15)' },
    oled: { name: 'OLED Black', background: '#000000', color: '#E5E5E5', cardBg: '#0A0A0A', border: 'rgba(255, 255, 255, 0.2)' },
    parchment: { name: 'Parchment', background: '#FAF6EE', color: '#2B261F', cardBg: '#FFFDF9', border: 'rgba(43, 38, 31, 0.12)' },
    white: { name: 'Crisp White', background: '#F9F9FB', color: '#1C2321', cardBg: '#FFFFFF', border: 'rgba(0, 0, 0, 0.08)' }
  };

  // Google Fonts Catalog
  const fontCatalog = {
    garamond: { name: 'EB Garamond', family: "'EB Garamond', Georgia, serif", category: 'Serif Classic' },
    lora: { name: 'Lora', family: "'Lora', Georgia, serif", category: 'Modern Serif' },
    spectral: { name: 'Spectral', family: "'Spectral', Georgia, serif", category: 'Luxury Serif' },
    georgia: { name: 'Georgia', family: "Georgia, 'Times New Roman', serif", category: 'Traditional' },
    inter: { name: 'Inter', family: "'Inter', system-ui, sans-serif", category: 'Modern Sans' },
    jakarta: { name: 'Plus Jakarta', family: "'Plus Jakarta Sans', sans-serif", category: 'Clean Sans' },
    hyperlegible: { name: 'Atkinson', family: "'Atkinson Hyperlegible', sans-serif", category: 'Dyslexic Friendly' },
    mono: { name: 'JetBrains', family: "'JetBrains Mono', monospace", category: 'Monospace' }
  };

  // Convert fontSizePercent (0 to 100) to pixel size (12px to 28px) and EPUB scale (75% to 155%)
  const calculatedPxSize = Math.round(12 + (fontSizePercent / 100) * 16);
  const calculatedEpubScale = `${Math.round(75 + (fontSizePercent / 100) * 80)}%`;

  // PDF Reader State
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [currentPageCanvas, setCurrentPageCanvas] = useState(null);
  const [pageDimensions, setPageDimensions] = useState({ width: 540, height: 720 });
  const [textItems, setTextItems] = useState([]);

  // Selection / AI Context State
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

  // Helper to extract word and 1-2 lines surrounding context at (x, y) coordinates for Apple Pencil & Touch
  const getWordAtPoint = (doc, x, y) => {
    if (!doc) return null;

    let range = null;
    if (doc.caretRangeFromPoint) {
      range = doc.caretRangeFromPoint(x, y);
    } else if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(x, y);
      if (pos && pos.offsetNode) {
        range = doc.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.setEnd(pos.offsetNode, pos.offset);
      }
    }

    if (!range || !range.startContainer || range.startContainer.nodeType !== 3) {
      return null;
    }

    const textNode = range.startContainer;
    const text = textNode.textContent;
    const offset = range.startOffset;

    if (!text || offset < 0 || offset > text.length) return null;

    let start = offset;
    while (start > 0 && /[\w\u00C0-\u024F\u0980-\u09FF'-]/.test(text[start - 1])) {
      start--;
    }

    let end = offset;
    while (end < text.length && /[\w\u00C0-\u024F\u0980-\u09FF'-]/.test(text[end])) {
      end++;
    }

    const word = text.slice(start, end).trim().replace(/^['"-]+|['"-]+$/g, '');
    if (!word || word.length < 2) return null;

    const wordRange = doc.createRange();
    wordRange.setStart(textNode, start);
    wordRange.setEnd(textNode, end);

    let parent = textNode.parentNode;
    while (parent && parent.ownerDocument && parent !== parent.ownerDocument.body && !['P', 'DIV', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'BODY'].includes(parent.nodeName)) {
      parent = parent.parentNode;
    }

    let fullText = parent ? (parent.textContent || parent.innerText || '').trim() : word;
    if (fullText.length > 280) {
      const idx = fullText.indexOf(word);
      if (idx !== -1) {
        const pStart = Math.max(0, idx - 110);
        const pEnd = Math.min(fullText.length, idx + word.length + 110);
        fullText = (pStart > 0 ? '...' : '') + fullText.substring(pStart, pEnd).trim() + (pEnd < fullText.length ? '...' : '');
      }
    }

    const rect = wordRange.getBoundingClientRect();

    return {
      word,
      context: fullText || word,
      rect
    };
  };

  // Helper to extract 1-2 lines (~240 characters) of rich surrounding context for AI range selection
  const extractRichContext = (range, word) => {
    if (!range) return word;
    try {
      let parent = range.commonAncestorContainer;
      if (parent && parent.nodeType !== 1) {
        parent = parent.parentNode;
      }

      while (parent && parent.ownerDocument && parent !== parent.ownerDocument.body && !['P', 'DIV', 'BLOCKQUOTE', 'SECTION', 'ARTICLE', 'BODY'].includes(parent.nodeName)) {
        parent = parent.parentNode;
      }

      let fullText = parent ? (parent.textContent || parent.innerText || '').trim() : word;

      if (fullText.length > 280) {
        const idx = fullText.indexOf(word);
        if (idx !== -1) {
          const start = Math.max(0, idx - 110);
          const end = Math.min(fullText.length, idx + word.length + 110);
          fullText = (start > 0 ? '...' : '') + fullText.substring(start, end).trim() + (end < fullText.length ? '...' : '');
        }
      }

      return fullText || word;
    } catch (e) {
      return word;
    }
  };

  // Initialize EPUB & PDF Readers
  useEffect(() => {
    if (!id) return;

    let isSubscribed = true;

    const initBook = async () => {
      try {
        const decodedId = decodeURIComponent(id);
        const record = await getBookData(decodedId);

        if (!record || !isSubscribed) {
          if (!record) {
            alert('Book not found in library.');
            router.push('/');
          }
          return;
        }

        setActiveBook(record);
        if (record.progressPercent) {
          setProgressPercent(record.progressPercent);
        }

        if (record.type === 'epub') {
          setTimeout(async () => {
            if (!viewerRef.current || !isSubscribed) return;

            const { default: ePub } = await import('epubjs');
            const book = ePub(record.data);
            bookRef.current = book;

            await book.ready;

            // Location index generation
            book.locations.generate(1000).catch(() => {});

            // Initialize Rendition with manager: 'continuous' and flow: 'paginated'
            const rend = book.renderTo(viewerRef.current, {
              width: '100%',
              height: '100%',
              flow: 'paginated',
              manager: 'continuous',
              spread: 'none'
            });

            renditionRef.current = rend;

            // Register Themes
            rend.themes.register('canvas', { "body": { "background": "#FAF8F5 !important", "color": "#1C2321 !important" } });
            rend.themes.register('dark', { "body": { "background": "#1C2321 !important", "color": "#F5F2EB !important" } });
            rend.themes.register('oled', { "body": { "background": "#000000 !important", "color": "#E5E5E5 !important" } });
            rend.themes.register('parchment', { "body": { "background": "#FFFDF9 !important", "color": "#2B261F !important" } });
            rend.themes.register('white', { "body": { "background": "#FFFFFF !important", "color": "#1C2321 !important" } });

            // Apply selected font, size, and line-height
            const fontObj = fontCatalog[readerFont] || fontCatalog.garamond;
            rend.themes.default({
              "html, body": {
                "margin": "0 !important",
                "padding": "0 !important",
                "height": "100% !important",
                "box-sizing": "border-box !important"
              },
              "p, div, span, blockquote": {
                "font-family": `${fontObj.family} !important`,
                "font-size": `${calculatedEpubScale} !important`,
                "line-height": `${lineHeight} !important`
              },
              "img, svg": {
                "max-width": "100% !important",
                "max-height": "75vh !important",
                "object-fit": "contain !important"
              }
            });

            rend.themes.select(readerTheme);

            // Apple Pencil Hover / Touch Hold & WebKit Document Selection Handler
            rend.on('rendered', (section, view) => {
              const doc = view.document;
              if (!doc) return;

              let hoverTimer = null;
              let lastHoverX = 0;
              let lastHoverY = 0;

              const triggerPointWord = (x, y) => {
                const result = getWordAtPoint(doc, x, y);
                if (result) {
                  const iframeElement = view.iframe || doc.defaultView.frameElement;
                  const iframeRect = iframeElement ? iframeElement.getBoundingClientRect() : { left: 0, top: 0 };

                  triggerAiDictionary(
                    result.word,
                    result.context,
                    result.rect.left + iframeRect.left,
                    result.rect.top + iframeRect.top,
                    Math.max(result.rect.width, 60),
                    Math.max(result.rect.height, 24)
                  );
                }
              };

              // 1. Apple Pencil Hover & Stylus Move Trigger (500ms Dwell)
              doc.addEventListener('pointermove', (e) => {
                const dist = Math.hypot(e.clientX - lastHoverX, e.clientY - lastHoverY);
                if (dist > 10) {
                  lastHoverX = e.clientX;
                  lastHoverY = e.clientY;
                  if (hoverTimer) clearTimeout(hoverTimer);

                  hoverTimer = setTimeout(() => {
                    triggerPointWord(e.clientX, e.clientY);
                  }, 500);
                }
              }, { passive: true });

              // 2. Apple Pencil / Touch Hold & Tap Trigger (500ms Hold)
              doc.addEventListener('pointerdown', (e) => {
                if (hoverTimer) clearTimeout(hoverTimer);
                hoverTimer = setTimeout(() => {
                  triggerPointWord(e.clientX, e.clientY);
                }, 500);
              }, { passive: true });

              // 3. Selection Event Fallback
              const handleSelectionCheck = () => {
                if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);

                selectionTimeoutRef.current = setTimeout(() => {
                  try {
                    let sel = doc.getSelection();
                    let activeDoc = doc;

                    if ((!sel || !sel.toString().trim()) && typeof window !== 'undefined' && window.getSelection) {
                      const topSel = window.getSelection();
                      if (topSel && topSel.toString().trim()) {
                        sel = topSel;
                        activeDoc = document;
                      }
                    }

                    if (!sel) return;

                    const word = sel.toString().trim();
                    if (!word || word.length < 2) return;

                    if (sel.rangeCount === 0) return;
                    const range = sel.getRangeAt(0);
                    if (!range) return;

                    let rect = range.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) {
                      const clientRects = range.getClientRects();
                      if (clientRects.length > 0) {
                        rect = clientRects[0];
                      }
                    }

                    const iframeElement = view.iframe || doc.defaultView.frameElement;
                    const iframeRect = (iframeElement && activeDoc === doc) ? iframeElement.getBoundingClientRect() : { left: 0, top: 0 };

                    const contextText = extractRichContext(range, word);

                    let absoluteX = rect.left + iframeRect.left;
                    let absoluteY = rect.top + iframeRect.top;

                    if (absoluteX <= 0 && absoluteY <= 0) {
                      absoluteX = window.innerWidth / 2 - 160;
                      absoluteY = window.innerHeight / 2 - 100;
                    }

                    const rectWidth = Math.max(rect.width || 0, 80);
                    const rectHeight = Math.max(rect.height || 0, 24);

                    triggerAiDictionary(word, contextText, absoluteX, absoluteY, rectWidth, rectHeight);
                  } catch (err) {
                    console.error('iOS WebKit selection handler error:', err);
                  }
                }, 500);
              };

              doc.addEventListener('touchend', handleSelectionCheck, { passive: true });
              doc.addEventListener('mouseup', handleSelectionCheck, { passive: true });
              doc.addEventListener('pointerup', handleSelectionCheck, { passive: true });
              doc.addEventListener('selectionchange', () => {
                const sel = doc.getSelection();
                if (sel && !sel.isCollapsed && sel.toString().trim().length >= 2) {
                  handleSelectionCheck();
                }
              }, { passive: true });
            });

            // Standard EPUB.js selection event fallback
            rend.on('selected', (cfiRange, contents) => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);

              selectionTimeoutRef.current = setTimeout(async () => {
                try {
                  const range = await rend.book.getRange(cfiRange);
                  const word = range.toString().trim();
                  if (!word || word.length < 2) return;

                  const contextText = extractRichContext(range, word);

                  const rect = range.getBoundingClientRect();
                  const iframeRect = contents.document.defaultView.frameElement.getBoundingClientRect();

                  triggerAiDictionary(
                    word,
                    contextText,
                    rect.left + iframeRect.left,
                    rect.top + iframeRect.top,
                    rect.width || 80,
                    rect.height || 24
                  );
                } catch (err) {
                  console.error('Error getting selection:', err);
                }
              }, 500);
            });

            rend.on('click', () => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
              closeAiDictionary();
            });

            // Display initial saved location or start of book
            if (record.lastLocation) {
              await rend.display(record.lastLocation);
            } else {
              await rend.display();
            }

            // Progression Relocation Listener
            rend.on('relocated', (location) => {
              closeAiDictionary();
              if (location && location.start) {
                const cfi = location.start.cfi;
                let pct = 0;
                if (book.locations && book.locations.total > 0) {
                  pct = Math.round((book.locations.percentageFromCfi(cfi) || 0) * 100);
                } else if (location.start.percentage !== undefined) {
                  pct = Math.round((location.start.percentage || 0) * 100);
                }

                pct = Math.min(100, Math.max(0, pct));
                setProgressPercent(pct);
                updateReadingProgress(decodedId, pct, cfi);
              }
            });

          }, 100);
        } else if (record.type === 'pdf') {
          const doc = await loadPDF(record.data);
          if (!isSubscribed) return;
          setPdfDoc(doc);
          const startPage = typeof record.lastLocation === 'number' ? record.lastLocation : 1;
          await loadPDFPage(doc, startPage, decodedId);
        }
      } catch (err) {
        console.error('Error initializing reader:', err);
      }
    };

    initBook();

    return () => {
      isSubscribed = false;
      if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    };
  }, [id, router]);

  // Dynamically update iframe styles when font, size, theme, or line-height change
  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(readerTheme);
      const fontObj = fontCatalog[readerFont] || fontCatalog.garamond;
      renditionRef.current.themes.default({
        "html, body": {
          "margin": "0 !important",
          "padding": "0 !important"
        },
        "p, div, span, blockquote": {
          "font-family": `${fontObj.family} !important`,
          "font-size": `${calculatedEpubScale} !important`,
          "line-height": `${lineHeight} !important`
        }
      });
    }
  }, [readerTheme, readerFont, fontSizePercent, lineHeight]);

  // Window Resize Listener
  useEffect(() => {
    const handleResize = () => {
      if (renditionRef.current) {
        renditionRef.current.resize('100%', '100%');
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard Arrow Listener
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

  const handlePageNext = async () => {
    closeAiDictionary();
    if (activeBook?.type === 'epub' && renditionRef.current) {
      renditionRef.current.next();
    } else if (activeBook?.type === 'pdf' && pdfDoc) {
      if (pdfCurrentPage < pdfDoc.numPages) {
        loadPDFPage(pdfDoc, pdfCurrentPage + 1);
      }
    }
  };

  const handlePagePrev = async () => {
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
    color: readerTheme === 'dark' || readerTheme === 'oled' ? '#F5F2EB' : '#1C2321',
    background: readerTheme === 'dark' || readerTheme === 'oled' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(245, 242, 235, 0.85)',
    border: readerTheme === 'dark' || readerTheme === 'oled' ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(28, 35, 33, 0.12)'
  };

  if (!activeBook) {
    return (
      <div className="min-h-screen bg-canvas-light flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-contrast-midnight)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  const currentColors = themeColors[readerTheme] || themeColors.canvas;

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden', background: currentColors.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Top Reading Progress Badge & Micro Indicator Line */}
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
          background: readerTheme === 'dark' || readerTheme === 'oled' ? 'rgba(28, 35, 33, 0.85)' : 'rgba(245, 242, 235, 0.9)',
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
            color: readerTheme === 'dark' || readerTheme === 'oled' ? '#F5F2EB' : '#1C2321'
          }}>
            {progressPercent}% Read
          </span>
        </div>
        <div style={{
          width: '100px',
          height: '3px',
          background: readerTheme === 'dark' || readerTheme === 'oled' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
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

      {/* Floating Controls */}
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
        title="Reader Settings"
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

      {/* Responsive Book Frame Canvas with outer padding */}
      <div 
        style={{
          width: 'min(92vw, 1050px)',
          height: 'min(85vh, 830px)',
          margin: '0 auto',
          position: 'relative',
          borderRadius: '16px',
          background: currentColors.cardBg,
          border: `1px solid ${currentColors.border}`,
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          padding: '24px 32px',
          boxSizing: 'border-box',
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
              position: 'relative'
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

      {/* Modern Impeccable Reader Settings Drawer Modal */}
      {isSettingsOpen ? (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            background: 'rgba(15, 20, 18, 0.55)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            style={{ 
              width: 'min(92vw, 460px)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px', 
              background: 'rgba(255, 255, 255, 0.94)', 
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 30px 70px -15px rgba(0,0,0,0.3)',
              padding: '24px',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(28,35,33,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2321' }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1C2321', fontFamily: fontCatalog[readerFont]?.family }}>
                    Typography & Canvas
                  </h3>
                  <span style={{ fontSize: '12px', color: 'rgba(28,35,33,0.5)', fontWeight: 500 }}>
                    Craft your reading environment
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1C2321' }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Section 1: Font Size Slider (0% - 100%) */}
            <div style={{ marginBottom: '24px', background: 'rgba(28,35,33,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Type size={16} style={{ color: 'rgba(28,35,33,0.6)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1C2321', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Font Size
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: '#1C2321', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                    {fontSizePercent}%
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(28,35,33,0.5)', fontWeight: 500 }}>
                    ({calculatedPxSize}px)
                  </span>
                </div>
              </div>

              {/* Slider Track */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => updateSetting('size', Math.max(0, fontSizePercent - 5), setFontSizePercent)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2321' }}
                >
                  <Minus size={14} />
                </button>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={fontSizePercent}
                  onChange={(e) => updateSetting('size', Number(e.target.value), setFontSizePercent)}
                  style={{ flex: 1, height: '6px', borderRadius: '3px', accentColor: '#1C2321', cursor: 'pointer' }}
                />
                <button 
                  onClick={() => updateSetting('size', Math.min(100, fontSizePercent + 5), setFontSizePercent)}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1C2321' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Section 2: Typeface Selector Grid */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(28,35,33,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '12px' }}>
                Typeface Collection
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {Object.entries(fontCatalog).map(([key, item]) => {
                  const isSelected = readerFont === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateSetting('font', key, setReaderFont)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #1C2321' : '1px solid rgba(0,0,0,0.08)',
                        background: isSelected ? '#1C2321' : 'rgba(255,255,255,0.7)',
                        color: isSelected ? '#FFFFFF' : '#1C2321',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: item.family, marginBottom: '2px' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10px', opacity: isSelected ? 0.7 : 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.category}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Line Height Spacing */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <AlignLeft size={16} style={{ color: 'rgba(28,35,33,0.6)' }} />
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(28,35,33,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Line Spacing
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { label: 'Compact', value: 1.4 },
                  { label: 'Balanced', value: 1.75 },
                  { label: 'Relaxed', value: 2.1 }
                ].map((item) => {
                  const isSelected = lineHeight === item.value;
                  return (
                    <button
                      key={item.label}
                      onClick={() => updateSetting('lineheight', item.value, setLineHeight)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #1C2321' : '1px solid rgba(0,0,0,0.08)',
                        background: isSelected ? '#1C2321' : 'white',
                        color: isSelected ? 'white' : '#1C2321',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Canvas Theme Tones */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Feather size={16} style={{ color: 'rgba(28,35,33,0.6)' }} />
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(28,35,33,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Canvas Atmosphere
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {Object.entries(themeColors).map(([key, tone]) => {
                  const isSelected = readerTheme === key;
                  return (
                    <button
                      key={key}
                      onClick={() => updateSetting('theme', key, setReaderTheme)}
                      title={tone.name}
                      style={{
                        height: '42px',
                        borderRadius: '12px',
                        background: tone.background,
                        border: isSelected ? '3px solid #d4af37' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isSelected ? '0 4px 12px rgba(212,175,55,0.3)' : 'none',
                        transition: 'transform 0.15s ease',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)'
                      }}
                    >
                      {isSelected ? <Check size={16} style={{ color: tone.color }} /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                onClick={() => {
                  updateSetting('theme', 'canvas', setReaderTheme);
                  updateSetting('font', 'garamond', setReaderFont);
                  updateSetting('size', 50, setFontSizePercent);
                  updateSetting('lineheight', 1.75, setLineHeight);
                }} 
                style={{ 
                  padding: '12px', 
                  borderRadius: '14px', 
                  border: '1px solid rgba(0,0,0,0.1)', 
                  background: 'white', 
                  cursor: 'pointer', 
                  color: 'rgba(28,35,33,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="btn-premium flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ borderRadius: '14px' }}
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
