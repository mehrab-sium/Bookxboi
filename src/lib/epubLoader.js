import ePub from 'epubjs';

class MockEPUBBook {
  constructor() {
    this.ready = Promise.resolve();
    this.spineItems = [
      { idref: 'ch1', href: 'chapter1.xhtml', linear: 'yes' },
      { idref: 'ch2', href: 'chapter2.xhtml', linear: 'yes' },
      { idref: 'ch3', href: 'chapter3.xhtml', linear: 'yes' }
    ];
    
    this.chapters = {
      'chapter1.xhtml': `
        <h1 style="font-family: var(--font-title); font-size: 28px; margin-bottom: 24px; color: var(--accent-primary); text-transform: uppercase;">Chapter I: The Aether Void</h1>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">The starship <em>Zephyr</em> hung motionless in the deep indigo silence of the Aether Void. Around it, distant nebulae glowed like cosmic dust, painting the darkness with strokes of emerald, violet, and magenta.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">Commander Elena Vance stood at the observation deck, her hands clasped behind her back. The glassmorphic viewport projected telemetry data directly onto her retinas, overlaying numbers onto the stars. She was searching for a particular anomaly—a tear in the quantum fabric of space-time that the sensors had flagged hours ago.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">\"We are approaching the event horizon, Commander,\" AI assistant Lyra whispered through the audio-link. Her voice was calm, yet Elena detected a subtle hesitation in her tone. Even AI felt the tension of the unknown.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">The void was not empty. It was filled with fluctuating energy fields that danced in response to the ship's gravitational wave generators. A beautiful but dangerous matrix of cosmic forces. Select words like <strong>anomaly</strong> or <strong>telemetry</strong> to activate the AI dictionary.</p>
      `,
      'chapter2.xhtml': `
        <h1 style="font-family: var(--font-title); font-size: 28px; margin-bottom: 24px; color: var(--accent-primary); text-transform: uppercase;">Chapter II: The Quantum Rift</h1>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">As the ship breached the barrier, a spectacular display of light erupted. The space around them began to twist and curl, mirroring the page of an ancient book folding over in a cosmic breeze.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">\"Shields at sixty percent and decaying,\" Lyra reported. Elena gripped the console. Through the viewport, she saw the rift expand, a beautiful, terrifying geometry of pure energy. They were no longer in their own universe; they had entered the Aether itself.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">The laws of physics here were malleable. Quantum superposition was visible to the naked eye; particles existed in multiple states simultaneously, leaving trailing paths of light as they shifted. This was the birthplace of cognitive light.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">Highlight words like <strong>superposition</strong> or <strong>malleable</strong> to test the contextual definitions.</p>
      `,
      'chapter3.xhtml': `
        <h1 style="font-family: var(--font-title); font-size: 28px; margin-bottom: 24px; color: var(--accent-primary); text-transform: uppercase;">Chapter III: The Singularity Gate</h1>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">At the center of the rift stood the Gate, a massive ring of dark matter stabilized by gravity anchors. It was the only way back to Earth, but it required a precise harmonic resonance frequency to open.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">Elena synchronized the ship's deflector dishes with the Gate's vibration. \"Initiating warp burst in three, two, one...\" The universe folded. In a fraction of a second, they traversed light-years, propelled by the bending of space-time.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">They emerged in orbit around a blue-green planet. Home. The voyage had ended, but the discoveries they brought back would change the course of human history forever.</p>
        <p style="margin-bottom: 16px; font-size: 16px; text-indent: 20px;">Try selecting words like <strong>synchronized</strong> or <strong>traversed</strong> to see how the client-side AI translates and explains them.</p>
      `
    };
  }

  get spine() {
    return {
      each: (cb) => {
        this.spineItems.forEach(cb);
      },
      get: (href) => {
        const item = this.spineItems.find(i => i.href === href);
        if (!item) return null;
        return {
          idref: item.idref,
          href: item.href,
          load: async () => {
            const html = this.chapters[href] || '<p>Chapter content missing</p>';
            return {
              body: {
                innerHTML: html
              }
            };
          }
        };
      }
    };
  }
}

export async function loadEPUB(file) {
  if (file === 'sample-epub') {
    return new MockEPUBBook();
  }
  const book = ePub(file);
  await book.ready;
  return book;
}

export function getSpineItems(book) {
  if (book instanceof MockEPUBBook) {
    return book.spineItems;
  }
  const items = [];
  book.spine.each((item) => {
    items.push({
      idref: item.idref,
      href: item.href,
      linear: item.linear
    });
  });
  return items;
}

export async function getChapterHTML(book, href) {
  if (book instanceof MockEPUBBook) {
    const item = book.spine.get(href);
    if (!item) throw new Error(`Spine item not found: ${href}`);
    const doc = await item.load();
    return doc.body.innerHTML;
  }

  const item = book.spine.get(href);
  if (!item) {
    throw new Error(`Spine item with href ${href} not found`);
  }
  
  const doc = await item.load(book.load.bind(book));
  
  const container = doc.createElement('div');
  container.innerHTML = doc.body.innerHTML;
  
  const images = container.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
      try {
        const absoluteUrl = book.resources.resolve(src, item.baseUrl);
        const blobUrl = await book.resources.createUrl(absoluteUrl);
        if (blobUrl) {
          img.setAttribute('src', blobUrl);
        }
      } catch (err) {
        console.warn(`Failed to resolve EPUB image src: ${src}`, err);
      }
    }
  }

  const links = container.querySelectorAll('a');
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  }
  
  return container.innerHTML;
}
