import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const booksDir = path.join(process.cwd(), 'public', 'books');
const coversDir = path.join(process.cwd(), 'public', 'covers');

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.epub'));

async function extractCover(filename) {
  const filepath = path.join(booksDir, filename);
  const buffer = fs.readFileSync(filepath);
  
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    // 1. Read container.xml to find OPF path
    let opfPath = 'content.opf';
    if (zip.files['META-INF/container.xml']) {
      const containerXml = await zip.files['META-INF/container.xml'].async('text');
      const match = containerXml.match(/full-path="([^"]+)"/i);
      if (match) opfPath = match[1];
    }
    
    const opfDir = path.dirname(opfPath) === '.' ? '' : path.dirname(opfPath);
    let coverHref = null;
    
    if (zip.files[opfPath]) {
      const opfXml = await zip.files[opfPath].async('text');
      
      // Look for meta cover item ID
      const metaCoverMatch = opfXml.match(/<meta\s+name="cover"\s+content="([^"]+)"/i) || opfXml.match(/<meta\s+content="([^"]+)"\s+name="cover"/i);
      if (metaCoverMatch) {
        const coverId = metaCoverMatch[1];
        const itemMatch = opfXml.match(new RegExp(`<item[^>]*id="${coverId}"[^>]*href="([^"]+)"`, 'i')) ||
                          opfXml.match(new RegExp(`<item[^>]*href="([^"]+)"[^>]*id="${coverId}"`, 'i'));
        if (itemMatch) {
          coverHref = itemMatch[1];
        }
      }
      
      // Look for properties="cover-image"
      if (!coverHref) {
        const propMatch = opfXml.match(/<item[^>]*properties="[^"]*cover-image[^"]*"[^>]*href="([^"]+)"/i) ||
                          opfXml.match(/<item[^>]*href="([^"]+)"[^>]*properties="[^"]*cover-image[^"]*"/i);
        if (propMatch) {
          coverHref = propMatch[1];
        }
      }
    }
    
    // Fallback: search zip files for common cover image paths
    if (!coverHref) {
      const candidates = Object.keys(zip.files).filter(f => 
        /\.(jpe?g|png|webp|gif)$/i.test(f) && /cover/i.test(f)
      );
      if (candidates.length > 0) {
        coverHref = candidates[0];
      }
    }
    
    if (coverHref) {
      // Resolve path relative to opfDir
      let targetPath = coverHref;
      if (opfDir && !coverHref.startsWith('/') && !coverHref.startsWith(opfDir)) {
        targetPath = path.posix.join(opfDir, coverHref);
      }
      targetPath = targetPath.replace(/^\//, '');

      let zipFile = zip.files[targetPath];
      if (!zipFile) {
        // Try searching by basename
        const base = path.basename(coverHref);
        const matchKey = Object.keys(zip.files).find(k => k.endsWith(base));
        if (matchKey) zipFile = zip.files[matchKey];
      }

      if (zipFile) {
        const ext = path.extname(targetPath) || '.jpg';
        const coverName = `${path.basename(filename, '.epub')}${ext}`;
        const outPath = path.join(coversDir, coverName);
        const imgBuffer = await zipFile.async('nodebuffer');
        fs.writeFileSync(outPath, imgBuffer);
        console.log(`[SUCCESS] Extracted cover for ${filename} -> ${coverName} (${imgBuffer.length} bytes)`);
        return `/covers/${coverName}`;
      }
    }

    // Secondary fallback: get first large image in zip
    const anyImageKeys = Object.keys(zip.files).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
    if (anyImageKeys.length > 0) {
      const firstImg = anyImageKeys[0];
      const ext = path.extname(firstImg) || '.jpg';
      const coverName = `${path.basename(filename, '.epub')}${ext}`;
      const outPath = path.join(coversDir, coverName);
      const imgBuffer = await zip.files[firstImg].async('nodebuffer');
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`[FALLBACK] Extracted image for ${filename} -> ${coverName}`);
      return `/covers/${coverName}`;
    }

    console.warn(`[WARN] No cover found for ${filename}`);
    return null;
  } catch (e) {
    console.error(`[ERROR] Failed to extract ${filename}:`, e.message);
    return null;
  }
}

async function run() {
  const map = {};
  for (const f of files) {
    const coverUrl = await extractCover(f);
    map[f] = coverUrl;
  }
  fs.writeFileSync(path.join(process.cwd(), 'scratch', 'covers_map.json'), JSON.stringify(map, null, 2));
  console.log('\nDone extracting covers!');
}

run();
