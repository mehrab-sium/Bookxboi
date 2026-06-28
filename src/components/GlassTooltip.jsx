import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Sparkles, Volume2, X, Key, ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';
import { getContextualDefinition, setSetting, getSetting } from '../lib/aiRouter';
import gsap from 'gsap';

export default function GlassTooltip({ word, rect, context, dictionaryLang, onClose }) {
  const tooltipRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [definitionData, setDefinitionData] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'KEY_MISSING' or 'API_ERROR' or 'CHROME_AI_UNAVAILABLE'
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Position the tooltip based on the selection rect
  useEffect(() => {
    if (!rect) return;

    const tooltipWidth = 320;
    const tooltipHeight = 240; // rough estimate
    
    // Calculate positioning to avoid overflow
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - 12; // place above text

    // Check bounds
    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = window.innerWidth - tooltipWidth - 16;
    }

    if (top < 16) {
      // Place below the selection if it overflows the top
      top = rect.bottom + 12;
    }

    // Include scroll offset
    setCoords({
      top: top + window.scrollY,
      left: left + window.scrollX,
    });
  }, [rect]);

  // Fetch definition
  const fetchDefinition = async () => {
    setLoading(true);
    setErrorType(null);
    try {
      const result = await getContextualDefinition(word, context, dictionaryLang);
      setDefinitionData(result);
    } catch (err) {
      console.error('Error fetching definition:', err);
      if (err.message === 'RATE_LIMIT') {
        setErrorType('RATE_LIMIT');
        setTimeout(() => {
          if (tooltipRef.current) {
            gsap.to(tooltipRef.current, { opacity: 0, duration: 1, ease: 'power2.inOut', onComplete: onClose });
          } else {
            onClose();
          }
        }, 2500);
      } else {
        const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : null;
        if (!savedKey) {
          setErrorType('KEY_MISSING');
        } else {
          setErrorType('API_ERROR');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timeoutId;

    if (word) {
      setLoading(true);
      timeoutId = setTimeout(() => {
        fetchDefinition();
      }, 600);
    }
    
    if (tooltipRef.current) {
      gsap.fromTo(tooltipRef.current, 
        { scale: 0.85, opacity: 0, y: 12 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }
      );
    }

    return () => clearTimeout(timeoutId);
  }, [word, context, dictionaryLang]);

  // Save API Key and retry
  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    
    sessionStorage.setItem('gemini_api_key', apiKeyInput.trim());
    setApiKeyInput('');
    fetchDefinition(); // retry
  };

  // Text to speech
  const handlePronounce = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!rect || !word) return null;

  // Premium design layout
  const tooltipContent = (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        padding: '16px',
        borderRadius: '12px',
        width: '320px',
        zIndex: 9999,
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={12} style={{ color: 'var(--accent-primary)' }} />
          Contextual AI Dictionary
        </span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
        >
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'col', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '8px' }}>
          <div className="spinner" style={{
            width: '24px',
            height: '24px',
            border: '2px solid rgba(139, 92, 246, 0.2)',
            borderTop: '2px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Consulting local & cloud Gemini models...</span>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : errorType === 'KEY_MISSING' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '13px', fontWeight: '500' }}>
            <Key size={16} />
            <span>AI Activation Required</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            To activate contextual dictionary features, please provide a free Gemini API Key (BYOK) or enable Chrome Built-in AI.
          </p>
          <form onSubmit={handleSaveKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              type="password"
              placeholder="Enter Gemini API Key..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="input-premium"
              style={{ fontSize: '12px', width: '100%' }}
            />
            <button type="submit" className="btn-premium" style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'center' }}>
              Activate API Key
            </button>
          </form>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '6px', marginTop: '4px' }}>
            Get a free key from Google AI Studio.
          </div>
        </div>
      ) : errorType === 'RATE_LIMIT' ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '12px' }}>
          <div style={{ color: 'var(--accent-primary)', opacity: 0.8 }}>
            <AlertTriangle size={24} />
          </div>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500', textAlign: 'center' }}>
            Take a breath.<br/>You are reading too fast.
          </span>
        </div>
      ) : errorType === 'API_ERROR' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
            <AlertTriangle size={16} />
            <span>Gemini API Call Failed</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            There was an error connecting to the API. Verify your API Key or connection.
          </p>
          <button onClick={fetchDefinition} className="btn-premium" style={{ fontSize: '12px', padding: '8px 12px', justifyContent: 'center' }}>
            Retry Definition
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
              {definitionData?.word || word}
            </span>
            <button
              onClick={handlePronounce}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Pronounce word"
            >
              <Volume2 size={16} />
            </button>
          </div>

          <div style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--text-secondary)', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '8px' }}>
            {definitionData?.english_context}
          </div>

          {definitionData?.bangla_translation && (
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', padding: '6px 8px', borderRadius: '6px', marginTop: '4px' }}>
              <span style={{ fontWeight: '600', color: 'var(--accent-primary)', fontSize: '11px' }}>TRANSLATION:</span>
              <span>{definitionData.bangla_translation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(tooltipContent, document.body);
}
