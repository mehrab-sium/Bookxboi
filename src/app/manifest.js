export default function manifest() {
  return {
    name: 'BookXBoi',
    short_name: 'BookXBoi',
    description: 'A bespoke, hyper-premium digital reading experience.',
    start_url: '/',
    display: 'standalone',
    background_color: '#111413',
    theme_color: '#F5F2EB',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
