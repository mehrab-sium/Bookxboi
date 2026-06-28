import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker to use a CDN to avoid Next.js bundling issues
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

// Custom Mock PDF implementation for the pre-loaded sample
class MockPDFPage {
  constructor(pageNum) {
    this.pageNum = pageNum;
    this.width = 600;
    this.height = 800;

    if (pageNum === 1) {
      this.title = "I. The Luminescent Fabric";
      this.lines = [
        "For centuries, humanity viewed light as a mere medium of observation,",
        "a passive stream of photons illuminating the physical world. However,",
        "with the advent of coherent quantum lattices, we discovered that light",
        "could be structured into solid geometries. We call this aether.",
        "These luminescent materials possess a highly fluid refractive index,",
        "allowing them to warp space-time at sub-atomic scales. The architecture",
        "is built upon optical conduits that guide energy with zero latency.",
        "To read this text, select any word like 'luminescent' or 'refractive'",
        "to trigger the contextual AI dictionary overlay instantly."
      ];
    } else if (pageNum === 2) {
      this.title = "II. Cognitive Resonance";
      this.lines = [
        "The human mind does not merely observe these light structures; it",
        "resonates with them. By using glassmorphic neuro-link viewports,",
        "individuals can project thoughts directly into the quantum engine.",
        "This cognitive symbiosis enables instantaneous calculations. The neural",
        "signals behave like electromagnetic waves, aligning with the aether",
        "waves in a spectacular, harmonious cadence. As a result, users feel",
        "a deep connection to the machine, experiencing data as a fluid sensory",
        "extension of their own consciousness. Highlight 'symbiosis' or 'resonance'",
        "to examine the AI definitions."
      ];
    } else {
      this.title = "III. Singular Dynamics";
      this.lines = [
        "At the heart of the gravity drive lies an artificial singularity.",
        "By bending the light fabric around this microscopic black hole,",
        "the vessel can achieve warp velocity without experiencing time",
        "dilation. The crew experiences a constant, peaceful environment,",
        "entirely decoupled from the surrounding relativistic distortions.",
        "The curvature of space-time is controlled by the outer shell,",
        "which modulates gravitational constants using highly dense baryonic",
        "crystals. Test selecting 'singularity' or 'relativistic' to try the",
        "offline AI or Gemini BYOK routing."
      ];
    }
  }

  getViewport({ scale }) {
    return {
      width: this.width * scale,
      height: this.height * scale,
      scale,
      transform: [scale, 0, 0, scale, 0, 0]
    };
  }

  async render({ canvasContext, viewport, theme = 'light' }) {
    const ctx = canvasContext;
    const scale = viewport.scale;
    const isDark = theme === 'dark';

    // Draw cream paper background
    ctx.fillStyle = isDark ? '#121212' : '#fcfaf2';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    // Draw elegant border
    ctx.strokeStyle = isDark ? '#2d2d3b' : '#e6dfd3';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(24 * scale, 24 * scale, viewport.width - 48 * scale, viewport.height - 48 * scale);

    // Draw page header
    ctx.fillStyle = isDark ? '#94a3b8' : '#8f887b';
    ctx.font = `${10 * scale}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText("AETHERIUS: ARCHITECTURE OF LIGHT", viewport.width / 2, 45 * scale);

    // Draw page footer / page number
    ctx.fillText(`Page ${this.pageNum} of 3`, viewport.width / 2, viewport.height - 45 * scale);

    // Draw Title
    ctx.fillStyle = isDark ? '#e2e8f0' : '#1c1b18';
    ctx.font = `bold ${18 * scale}px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.fillText(this.title, 55 * scale, 110 * scale);

    // Draw lines of text
    ctx.fillStyle = isDark ? '#e2e8f0' : '#2c2a25';
    ctx.font = `${13.5 * scale}px Georgia, serif`;
    
    // Set line height
    const lineGap = 32 * scale;
    const startY = 160 * scale;

    this.lines.forEach((line, index) => {
      ctx.fillText(line, 55 * scale, startY + index * lineGap);
    });
  }

  async getTextContent() {
    const items = [];
    const startY = 160;
    const lineGap = 32;

    this.lines.forEach((line, lineIndex) => {
      const words = line.split(' ');
      let currentX = 55;
      
      words.forEach((word) => {
        const wordWidth = word.length * 7.5;
        const wordHeight = 15;
        
        items.push({
          str: word,
          width: wordWidth,
          height: wordHeight,
          transform: [13.5, 0, 0, 13.5, currentX, startY + lineIndex * lineGap]
        });

        currentX += wordWidth + 6;
      });
    });

    return { items };
  }
}

class MockPDFDocument {
  constructor() {
    this.numPages = 3;
  }
  async getPage(pageNum) {
    return new MockPDFPage(pageNum);
  }
}

export async function loadPDF(url) {
  if (url === 'sample-pdf') {
    return new MockPDFDocument();
  }
  const loadingTask = pdfjsLib.getDocument(url);
  return await loadingTask.promise;
}

export async function getPDFPageData(pdfDoc, pageNum, containerWidth = 540, containerHeight = 720, theme = 'light') {
  const isMock = pdfDoc instanceof MockPDFDocument;
  const page = await pdfDoc.getPage(pageNum);
  
  const baseViewport = page.getViewport({ scale: 1.0 });
  
  // Calculate scale factor to fit exactly inside the reader container
  const scale = Math.min(containerWidth / baseViewport.width, containerHeight / baseViewport.height);
  
  // Render viewport (2x for crisp high-DPI display)
  const renderViewport = page.getViewport({ scale: scale * 2 });
  
  // Layout viewport (matches screen pixels exactly)
  const layoutViewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  canvas.width = renderViewport.width;
  canvas.height = renderViewport.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create 2D context for offscreen PDF rendering');
  }
  
  if (isMock) {
    await page.render({ canvasContext: ctx, viewport: renderViewport, theme });
  } else {
    ctx.fillStyle = theme === 'dark' ? '#121212' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({
      canvasContext: ctx,
      viewport: renderViewport
    }).promise;
  }
  
  const textContent = await page.getTextContent();
  const textItems = textContent.items
    .filter((item) => item.str.trim() !== '')
    .map((item) => {
      if (isMock) {
        return {
          text: item.str,
          left: item.transform[4] * scale,
          top: item.transform[5] * scale - item.transform[0] * scale,
          width: item.width * scale,
          height: item.height * scale,
          fontSize: item.transform[0] * scale
        };
      }
      
      // Map raw coordinates into layout viewport space (pixels)
      const transform = pdfjsLib.Util.transform(
        pdfjsLib.Util.transform(layoutViewport.transform, item.transform),
        [1, 0, 0, -1, 0, 0]
      );
      
      const left = transform[4];
      const top = transform[5] - transform[3];
      const width = (item.width || (item.str.length * 8)) * scale;
      const height = (item.height || 14) * scale;
      const fontSize = transform[3];
      
      return {
        text: item.str,
        left,
        top,
        width,
        height,
        fontSize
      };
    });
    
  return {
    canvas,
    width: layoutViewport.width,
    height: layoutViewport.height,
    textItems
  };
}
