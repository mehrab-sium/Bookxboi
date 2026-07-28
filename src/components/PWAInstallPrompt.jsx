'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Register Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const registerSW = () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('ServiceWorker registered with scope: ', registration.scope);
        },
        (err) => {
          console.error('ServiceWorker registration failed: ', err);
        }
      );
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // Detect beforeinstallprompt & iOS Safari
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);

    if (isIosDevice && isSafari && !window.navigator.standalone) {
      setIsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  // Do not render inside reader page to guarantee zero UI overlap with controls or pagination
  if (pathname?.startsWith('/reader')) return null;
  if (isInstalled) return null;

  return (
    <>
      {/* Standard PWA Install Prompt Button */}
      {deferredPrompt ? (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(28, 35, 33, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '10px 18px',
          borderRadius: '9999px',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#F5F2EB', letterSpacing: '0.05em' }}>
            Install BookXBoi App
          </span>
          <button
            onClick={handleInstallClick}
            style={{
              background: '#d4af37',
              color: '#111413',
              border: 'none',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            Install
          </button>
        </div>
      ) : null}

      {/* iOS Safari Add to Home Screen Button */}
      {isIOS && !showIOSPrompt ? (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9990
        }}>
          <button
            onClick={() => setShowIOSPrompt(true)}
            style={{
              background: 'rgba(28, 35, 33, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: '#F5F2EB',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: '9999px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            <Share size={14} style={{ color: '#d4af37' }} />
            Add to Home Screen
          </button>
        </div>
      ) : null}

      {/* iOS Instructional Modal */}
      {isIOS && showIOSPrompt ? (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9995,
          width: 'min(90vw, 360px)',
          background: 'rgba(28, 35, 33, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          color: '#F5F2EB'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#d4af37', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share size={16} />
              Install on iOS Safari
            </span>
            <button
              onClick={() => setShowIOSPrompt(false)}
              style={{ background: 'transparent', border: 'none', color: '#F5F2EB', opacity: 0.6, cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
          <p style={{ fontSize: '12px', lineHeight: '1.5', margin: 0, opacity: 0.9 }}>
            Tap the <strong style={{ color: '#d4af37' }}>Share</strong> button in Safari's bottom toolbar, then select <strong style={{ color: '#d4af37' }}>"Add to Home Screen"</strong>.
          </p>
        </div>
      ) : null}
    </>
  );
}
