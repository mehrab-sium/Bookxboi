const fs = require('fs');

const content = `
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Settings, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getBookData } from '../../../lib/libraryStore';
import GlassTooltip from '../../../components/GlassTooltip';
import TextSelectionLayer from '../../../components/TextSelectionLayer';
import { loadPDF, getPDFPageData } from '../../../lib/pdfLoader';

export default function ReaderPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [activeBook, setActiveBook] = useState(null);
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const selectionTimeoutRef = useRef(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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
        const record = await getBookData(decodeURIComponent(id));
        if (!record) {
          alert('Book not found in local library.');
          router.push('/');
          return;
        }
        setActiveBook(record);

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

            rend.themes.default({
              "body": { 
                "background": "#F5F2EB !important", 
                "color": "#1C2321 !important", 
                "font-family": "Ogg, var(--font-display), serif !important", 
                "padding": "0 10% !important" 
              },
              "p": { 
                "font-size": "1.15rem !important", 
                "line-height": "1.8 !important" 
              }
            });

            rend.on('selected', (cfiRange, contents) => {
              if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
              
              selectionTimeoutRef.current = setTimeout(async () => {
                const range = await rend.book.getRange(cfiRange);
                const word = range.toString().trim();
                
                if (!word) return;

                // Extract surrounding context (the whole paragraph)
                let contextText = word;
                if (range.startContainer && range.startContainer.parentNode) {
                  contextText = range.startContainer.parentNode.textContent || word;
                }
                
                // Calculate coordinates for the popup relative to the viewport
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

            rend.display();
            renditionRef.current = rend;
          }, 100);
        } else if (record.type === 'pdf') {
          const doc = await loadPDF(record.data);
          setPdfDoc(doc);
          await loadPDFPage(doc, 1);
        }
      } catch (err) {
        console.error('Failed to load book', err);
      }
    };
    initBook();
  }, [id, router]);

  const loadPDFPage = async (doc, pageNum) => {
    try {
      const pageData = await getPDFPageData(doc, pageNum, 540, 720);
      setTextItems(pageData.textItems);
      setCurrentPageCanvas(pageData.canvas);
      setPageDimensions({ width: pageData.width, height: pageData.height });
      setPdfCurrentPage(pageNum);
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
    transition: 'transform 0.2s'
  };

  if (!activeBook) {
    return (
      <div className="min-h-screen bg-canvas-light flex items-center justify-center">
        <div className="spinner" style={{ width: '32px', height: '32px', border: '2px solid rgba(0,0,0,0.1)', borderTop: '2px solid var(--color-contrast-midnight)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', background: '#F5F2EB' }}>
      
      {/* Floating Action Buttons */}
      <button 
        onClick={() => router.push('/')}
        style={{ ...fabStyle, top: '24px', left: '24px' }}
        title="Back to Library"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <ArrowLeft size={24} />
      </button>

      <button 
        onClick={() => setIsSettingsOpen(true)}
        style={{ ...fabStyle, top: '24px', right: '24px' }}
        title="Settings"
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Settings size={24} />
      </button>

      <button 
        onClick={handlePagePrev}
        style={{ ...fabStyle, top: '50%', left: '24px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronLeft size={24} />
      </button>

      <button 
        onClick={handlePageNext}
        style={{ ...fabStyle, top: '50%', right: '24px', transform: 'translateY(-50%)' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
      >
        <ChevronRight size={24} />
      </button>

      {/* Reader Containers */}
      {activeBook.type === 'epub' && (
        <div
          ref={viewerRef}
          style={{
            height: '100vh',
            width: '100%',
            position: 'absolute',
            inset: 0
          }}
        />
      )}

      {activeBook.type === 'pdf' && (
        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justify-content: 'center' }}>
          <div style={{ 
            width: \`\${pageDimensions.width}px\`, 
            height: \`\${pageDimensions.height}px\`,
            position: 'relative',
            transform: \`scale(min(1, calc(100vw / \${pageDimensions.width + 100}), calc(100vh / \${pageDimensions.height + 150})))\`,
            transformOrigin: 'center center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            background: 'white'
          }}>
            {currentPageCanvas && (
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
            )}
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
      )}

      {/* GlassTooltip Overlay */}
      {selectedWord && selectionRect && (
        <GlassTooltip 
          word={selectedWord} 
          rect={selectionRect} 
          context={selectionContext} 
          dictionaryLang="both"
          onClose={closeAiDictionary}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
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
            
            <div className="text-core text-contrast-midnight/80 mb-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-2">Typography</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary-glass" style={{ flex: 1, padding: '8px' }}>Serif</button>
                  <button className="btn-secondary-glass" style={{ flex: 1, padding: '8px' }}>Sans</button>
                </div>
              </div>
              
              <div>
                <label className="text-xs uppercase tracking-widest text-contrast-midnight/50 block mb-2">Canvas Tone</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F2EB', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer' }} />
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1C2321', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="btn-premium w-full flex justify-center py-3"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/app/reader/[id]/page.js', content, 'utf8');
console.log('src/app/reader/[id]/page.js written.');
