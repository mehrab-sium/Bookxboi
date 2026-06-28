// IndexedDB Settings Store and Client-Side AI Router
const DB_NAME = 'PremiumReaderSettingsDB';
const STORE_NAME = 'settings';
const DB_VERSION = 1;

function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser environments'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSetting(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB error getting setting:', err);
    return null;
  }
}

export async function setSetting(key, value) {
  try {
    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('IndexedDB error setting value:', err);
  }
}

// Layer 1: Call Gemini API directly from the browser
async function fetchGeminiDefinition(word, context, apiKey, dictionaryLang = 'english') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;
  
  const systemInstruction = `You are a concise, elite dictionary assistant. 
Analyze the word strictly within its context. Be ultra-short, precise, and professional. 
Output purely JSON. No fluff.`;

  const prompt = `Analyze this 500-word context. The user selected the word '${word}'. Return a JSON object with exactly two keys: 'english_context' (a short 1-sentence explanation of what it means here) and 'bangla_translation' (the precise Bengali meaning based on this context).

Context: "${context}"`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 150
      }
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  return JSON.parse(text.trim());
}

// Layer 2: Call Chrome's local window.ai.languageModel API
async function fetchChromeAIDefinition(word, context, dictionaryLang = 'english') {
  const winAI = window.ai;
  if (!winAI || !winAI.languageModel) {
    throw new Error('CHROME_AI_UNAVAILABLE');
  }

  const capabilities = await winAI.languageModel.capabilities();
  if (capabilities.available === 'no') {
    throw new Error('CHROME_AI_UNAVAILABLE');
  }

  const session = await winAI.languageModel.create({
    systemPrompt: `You are a concise dictionary helper. Return ultra-short, professional JSON only. Keys: english_context, bangla_translation.`
  });

  const prompt = `Analyze this 500-word context. The user selected the word '${word}'. Return a JSON object with exactly two keys: 'english_context' (a short 1-sentence explanation of what it means here) and 'bangla_translation' (the precise Bengali meaning based on this context).\n\nContext: "${context}"`;

  const response = await session.prompt(prompt);
  
  const cleaned = response
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  session.destroy(); 
  return JSON.parse(cleaned);
}

// Unified Router
export async function getContextualDefinition(word, context, dictionaryLang = 'english') {
  const cleanWord = word.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
  
  // Try Layer 1: Gemini API BYOK
  const apiKey = typeof window !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : null;
  if (apiKey && apiKey.trim() !== '') {
    try {
      console.log('Routing to Gemini API BYOK...');
      return await fetchGeminiDefinition(cleanWord, context, apiKey, dictionaryLang);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') throw err;
      console.error('BYOK Gemini API error, attempting fallback to window.ai...', err);
    }
  }

  // Try Layer 2: Chrome window.ai
  try {
    console.log('Routing to Chrome Local window.ai...');
    return await fetchChromeAIDefinition(cleanWord, context, dictionaryLang);
  } catch (err) {
    console.error('Chrome window.ai failed or not supported:', err.message);
    throw err; 
  }
}
