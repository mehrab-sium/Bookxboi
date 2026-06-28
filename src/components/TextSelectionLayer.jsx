import React, { useRef, useEffect } from 'react';

export default function TextSelectionLayer({
  textItems,
  pageWidth,
  pageHeight,
  onSelectionChange,
}) {
  const containerRef = useRef(null);

  // Monitor selection change on mouse up / touch end
  useEffect(() => {
    const handleSelection = (e) => {
      // Ignore clicks inside the tooltip so it doesn't close when interacting with the API key input
      if (e && e.target && e.target.closest && e.target.closest('.glass-tooltip')) {
        return;
      }

      const selection = window.getSelection();
      if (!selection) return;

      const selectedText = selection.toString().trim();
      if (selectedText.length > 0) {
        try {
          const range = selection.getRangeAt(0);
          
          // Make sure selection is inside the reader container
          const readerContainer = document.querySelector('.reader-main');
          if (readerContainer && readerContainer.contains(range.commonAncestorContainer)) {
            const rect = range.getBoundingClientRect();
            
            // Get the sentence/context around the selected text
            let context = '';
            const parentElement = range.commonAncestorContainer.parentElement;
            if (parentElement) {
              context = parentElement.innerText || parentElement.textContent || '';
            }
            
            // If the parent element text is too short, walk up the DOM tree slightly
            if (context.length < 200 && parentElement && parentElement.parentElement) {
              context = parentElement.parentElement.innerText || '';
            }
            
            onSelectionChange(selectedText, rect, context);
          }
        } catch (e) {
          console.error('Error getting selection range:', e);
        }
      } else {
        onSelectionChange('', null, '');
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [onSelectionChange]);

  if (!textItems || textItems.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        zIndex: 20,
        pointerEvents: 'auto',
        userSelect: 'text',
        WebkitUserSelect: 'text',
      }}
    >
      {textItems.map((item, index) => {
        // Absolute position each text element based on original PDF layout
        return (
          <span
            key={index}
            style={{
              position: 'absolute',
              left: `${item.left}px`,
              top: `${item.top}px`,
              width: item.width ? `${item.width}px` : 'auto',
              height: item.height ? `${item.height}px` : 'auto',
              fontSize: `${item.fontSize}px`,
              fontFamily: 'sans-serif',
              color: 'transparent',
              lineHeight: 1,
              whiteSpace: 'pre',
              transformOrigin: 'top left',
              pointerEvents: 'auto',
              // Use selection background style
              cursor: 'text',
            }}
          >
            {item.text}
          </span>
        );
      })}
    </div>
  );
}
