'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, ArrowLeft, ExternalLink, CheckCircle } from 'lucide-react';
import GlobalHeader from '../../../components/GlobalHeader';

export default function ApiKeySettings() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load existing key from sessionStorage if available
    const existingKey = sessionStorage.getItem('gemini_api_key');
    if (existingKey) {
      setApiKey(existingKey);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      sessionStorage.setItem('gemini_api_key', apiKey.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      sessionStorage.removeItem('gemini_api_key');
    }
  };

  return (
    <main className="min-h-screen bg-canvas-light text-contrast-midnight font-sans pt-32 px-8 pb-24">
      <GlobalHeader />
      
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-contrast-midnight/60 hover:text-contrast-midnight transition-colors mb-8 text-sm uppercase tracking-widest font-medium"
        >
          <ArrowLeft size={16} /> Back to Library
        </button>
        
        <h1 className="text-soul text-4xl mb-6">AI Context Engine</h1>
        <p className="text-core text-contrast-midnight/80 leading-relaxed mb-12 border-b border-contrast-midnight/10 pb-8">
          Boi uses Google's Gemini Flash-Lite model to provide instantaneous definitions and contextual explanations while you read. To maintain your privacy and eliminate subscription fees, you provide your own API key. Keys are strictly kept in your browser's temporary session storage and are wiped when you close the tab.
        </p>
        
        <div className="glass-panel p-8 rounded-xl" style={{ boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-soul text-2xl mb-2 flex items-center gap-3">
                <Key size={24} className="text-contrast-sepia" /> Gemini API Key
              </h2>
              <p className="text-core text-sm text-contrast-midnight/60">
                Requires a valid Google AI Studio key.
              </p>
            </div>
            
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary-glass flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest"
            >
              Get Free Key <ExternalLink size={14} />
            </a>
          </div>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API key here..."
                className="w-full bg-white/50 border border-contrast-midnight/10 rounded-lg px-6 py-4 text-core text-contrast-midnight placeholder:text-contrast-midnight/30 focus:outline-none focus:border-contrast-midnight/30 focus:ring-1 focus:ring-contrast-midnight/30 transition-all"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-contrast-midnight/50 font-medium">
                {isSaved ? (
                  <span className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={14} /> Secured in session
                  </span>
                ) : (
                  'Key resets upon closing tab.'
                )}
              </span>
              
              <button 
                type="submit" 
                className="btn-premium px-8 py-3 flex items-center gap-2 transition-transform duration-300 hover:scale-[1.02]"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
