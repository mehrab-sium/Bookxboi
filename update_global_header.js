const fs = require('fs');
const path = 'src/components/GlobalHeader.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `import { Menu, X } from 'lucide-react';`,
  `import { Menu, X, Key } from 'lucide-react';`
);

content = content.replace(
  `{/* Right Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-12 text-core text-[11px] uppercase tracking-widest font-medium">`,
  `{/* Right Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-10 text-core text-[11px] uppercase tracking-widest font-medium">
            <Link 
              href="/settings/keys"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              className="inline-block transition-opacity duration-300 hover:opacity-60 flex items-center"
              title="API Settings"
            >
              <Key size={18} />
            </Link>`
);

fs.writeFileSync(path, content, 'utf8');
console.log('GlobalHeader updated');
