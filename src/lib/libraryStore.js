// Client-Side IndexedDB Storage & Progress Persistence for Books
const DB_NAME = 'PremiumReaderLibraryDB';
const STORE_NAME = 'books';
const DB_VERSION = 1;

// Curated Masterpiece Public Books served online from /books/ with pre-extracted covers
export const PUBLIC_BOOKS = [
  {
    id: 'pub-ali-madonna',
    name: 'Madonna in a Fur Coat',
    author: 'Sabahattin Ali',
    fileName: 'Ali_Madonna_in_a_Fur_Coat.epub',
    url: '/books/Ali_Madonna_in_a_Fur_Coat.epub',
    coverImage: '/covers/Ali_Madonna_in_a_Fur_Coat.jpg',
    type: 'epub',
    addedAt: 1700000001000
  },
  {
    id: 'pub-bronte-jane-eyre',
    name: 'Jane Eyre',
    author: 'Charlotte Brontë',
    fileName: 'Bronte_Jane_Eyre.epub',
    url: '/books/Bronte_Jane_Eyre.epub',
    coverImage: '/covers/Bronte_Jane_Eyre.jpg',
    type: 'epub',
    addedAt: 1700000002000
  },
  {
    id: 'pub-bronte-wuthering-heights',
    name: 'Wuthering Heights',
    author: 'Emily Brontë',
    fileName: 'Bronte_Wuthering_Heights.epub',
    url: '/books/Bronte_Wuthering_Heights.epub',
    coverImage: '/covers/Bronte_Wuthering_Heights.jpg',
    type: 'epub',
    addedAt: 1700000003000
  },
  {
    id: 'pub-camus-myth-of-sisyphus',
    name: 'The Myth of Sisyphus',
    author: 'Albert Camus',
    fileName: 'Camus_The_Myth_of_Sisyphus_and_Other_Essays.epub',
    url: '/books/Camus_The_Myth_of_Sisyphus_and_Other_Essays.epub',
    coverImage: '/covers/Camus_The_Myth_of_Sisyphus_and_Other_Essays.jpg',
    type: 'epub',
    addedAt: 1700000004000
  },
  {
    id: 'pub-camus-plague',
    name: 'The Plague',
    author: 'Albert Camus',
    fileName: 'Camus_The_Plague.epub',
    url: '/books/Camus_The_Plague.epub',
    coverImage: '/covers/Camus_The_Plague.jpeg',
    type: 'epub',
    addedAt: 1700000005000
  },
  {
    id: 'pub-dazai-no-longer-human',
    name: 'No Longer Human',
    author: 'Osamu Dazai',
    fileName: 'Dazai_No_Longer_Human.epub',
    url: '/books/Dazai_No_Longer_Human.epub',
    coverImage: '/covers/Dazai_No_Longer_Human.jpg',
    type: 'epub',
    addedAt: 1700000006000
  },
  {
    id: 'pub-dickens-tale-of-two-cities',
    name: 'A Tale of Two Cities',
    author: 'Charles Dickens',
    fileName: 'Dickens_A_Tale_of_Two_Cities.epub',
    url: '/books/Dickens_A_Tale_of_Two_Cities.epub',
    coverImage: '/covers/Dickens_A_Tale_of_Two_Cities.jpg',
    type: 'epub',
    addedAt: 1700000007000
  },
  {
    id: 'pub-dostoevsky-idiot',
    name: 'The Idiot',
    author: 'Fyodor Dostoevsky',
    fileName: 'Dostoevsky_The_Idiot.epub',
    url: '/books/Dostoevsky_The_Idiot.epub',
    coverImage: '/covers/Dostoevsky_The_Idiot.jpg',
    type: 'epub',
    addedAt: 1700000008000
  },
  {
    id: 'pub-dostoyevsky-crime-and-punishment',
    name: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    fileName: 'Dostoyevsky_Crime_and_Punishment.epub',
    url: '/books/Dostoyevsky_Crime_and_Punishment.epub',
    coverImage: '/covers/Dostoyevsky_Crime_and_Punishment.jpg',
    type: 'epub',
    addedAt: 1700000009000
  },
  {
    id: 'pub-dostoyevsky-notes-from-underground',
    name: 'Notes from Underground',
    author: 'Fyodor Dostoevsky',
    fileName: 'Dostoyevsky_Notes_from_the_Underground.epub',
    url: '/books/Dostoyevsky_Notes_from_the_Underground.epub',
    coverImage: '/covers/Dostoyevsky_Notes_from_the_Underground.jpg',
    type: 'epub',
    addedAt: 1700000010000
  },
  {
    id: 'pub-dostoyevsky-brothers-karamazov',
    name: 'The Brothers Karamazov',
    author: 'Fyodor Dostoevsky',
    fileName: 'Dostoyevsky_The_Brothers_Karamazov.epub',
    url: '/books/Dostoyevsky_The_Brothers_Karamazov.epub',
    coverImage: '/covers/Dostoyevsky_The_Brothers_Karamazov.jpg',
    type: 'epub',
    addedAt: 1700000011000
  },
  {
    id: 'pub-dostoyevsky-white-nights',
    name: 'White Nights',
    author: 'Fyodor Dostoevsky',
    fileName: 'Dostoyevsky_White_Nights.epub',
    url: '/books/Dostoyevsky_White_Nights.epub',
    coverImage: '/covers/Dostoyevsky_White_Nights.jpg',
    type: 'epub',
    addedAt: 1700000012000
  },
  {
    id: 'pub-goethe-werther',
    name: 'The Sorrows of Young Werther',
    author: 'Johann Wolfgang von Goethe',
    fileName: 'Goethe_Sorrows_of_Young_Werther.epub',
    url: '/books/Goethe_Sorrows_of_Young_Werther.epub',
    coverImage: '/covers/Goethe_Sorrows_of_Young_Werther.jpeg',
    type: 'epub',
    addedAt: 1700000013000
  },
  {
    id: 'pub-huxley-brave-new-world',
    name: 'Brave New World',
    author: 'Aldous Huxley',
    fileName: 'Huxley_Brave_New_World.epub',
    url: '/books/Huxley_Brave_New_World.epub',
    coverImage: '/covers/Huxley_Brave_New_World.jpeg',
    type: 'epub',
    addedAt: 1700000014000
  },
  {
    id: 'pub-kafka-metamorphosis',
    name: 'The Metamorphosis',
    author: 'Franz Kafka',
    fileName: 'Kafka_Metamorphosis.epub',
    url: '/books/Kafka_Metamorphosis.epub',
    coverImage: '/covers/Kafka_Metamorphosis.jpg',
    type: 'epub',
    addedAt: 1700000015000
  },
  {
    id: 'pub-kafka-trial',
    name: 'The Trial',
    author: 'Franz Kafka',
    fileName: 'Kafka_The_Trial.epub',
    url: '/books/Kafka_The_Trial.epub',
    coverImage: '/covers/Kafka_The_Trial.png',
    type: 'epub',
    addedAt: 1700000016000
  },
  {
    id: 'pub-kierkegaard-fear-and-trembling',
    name: 'Fear and Trembling',
    author: 'Søren Kierkegaard',
    fileName: 'Kierkegaard_Fear_and_Trembling.epub',
    url: '/books/Kierkegaard_Fear_and_Trembling.epub',
    coverImage: '/covers/Kierkegaard_Fear_and_Trembling.jpg',
    type: 'epub',
    addedAt: 1700000017000
  },
  {
    id: 'pub-machiavelli-prince',
    name: 'The Prince',
    author: 'Niccolò Machiavelli',
    fileName: 'Machiavelli_The_Prince.epub',
    url: '/books/Machiavelli_The_Prince.epub',
    coverImage: '/covers/Machiavelli_The_Prince.jpeg',
    type: 'epub',
    addedAt: 1700000018000
  },
  {
    id: 'pub-marcus-aurelius-meditations',
    name: 'Meditations',
    author: 'Marcus Aurelius',
    fileName: 'Marcus_Aurelius_Meditations.epub',
    url: '/books/Marcus_Aurelius_Meditations.epub',
    coverImage: '/covers/Marcus_Aurelius_Meditations.jpeg',
    type: 'epub',
    addedAt: 1700000019000
  },
  {
    id: 'pub-nietzsche-beyond-good-and-evil',
    name: 'Beyond Good and Evil',
    author: 'Friedrich Nietzsche',
    fileName: 'Nietzsche_Beyond_Good_and_Evil.epub',
    url: '/books/Nietzsche_Beyond_Good_and_Evil.epub',
    coverImage: '/covers/Nietzsche_Beyond_Good_and_Evil.jpg',
    type: 'epub',
    addedAt: 1700000020000
  },
  {
    id: 'pub-nietzsche-thus-spoke-zarathustra',
    name: 'Thus Spoke Zarathustra',
    author: 'Friedrich Nietzsche',
    fileName: 'Nietzsche_Thus_Spoke_Zarathustra.epub',
    url: '/books/Nietzsche_Thus_Spoke_Zarathustra.epub',
    coverImage: '/covers/Nietzsche_Thus_Spoke_Zarathustra.jpg',
    type: 'epub',
    addedAt: 1700000021000
  },
  {
    id: 'pub-orwell-1984',
    name: '1984',
    author: 'George Orwell',
    fileName: 'Orwell_1984.epub',
    url: '/books/Orwell_1984.epub',
    coverImage: '/covers/Orwell_1984.jpg',
    type: 'epub',
    addedAt: 1700000022000
  },
  {
    id: 'pub-plath-bell-jar',
    name: 'The Bell Jar',
    author: 'Sylvia Plath',
    fileName: 'Plath_The_Bell_Jar.epub',
    url: '/books/Plath_The_Bell_Jar.epub',
    coverImage: '/covers/Plath_The_Bell_Jar.jpeg',
    type: 'epub',
    addedAt: 1700000023000
  },
  {
    id: 'pub-steinbeck-east-of-eden',
    name: 'East of Eden',
    author: 'John Steinbeck',
    fileName: 'Steinbeck_East_of_Eden.epub',
    url: '/books/Steinbeck_East_of_Eden.epub',
    coverImage: '/covers/Steinbeck_East_of_Eden.jpg',
    type: 'epub',
    addedAt: 1700000024000
  },
  {
    id: 'pub-steinbeck-pearl',
    name: 'The Pearl',
    author: 'John Steinbeck',
    fileName: 'Steinbeck_The_Pearl.epub',
    url: '/books/Steinbeck_The_Pearl.epub',
    coverImage: '/covers/Steinbeck_The_Pearl.jpg',
    type: 'epub',
    addedAt: 1700000025000
  },
  {
    id: 'pub-tolstoy-anna-karenina',
    name: 'Anna Karenina',
    author: 'Leo Tolstoy',
    fileName: 'Tolstoy_Anna_Karenina.epub',
    url: '/books/Tolstoy_Anna_Karenina.epub',
    coverImage: '/covers/Tolstoy_Anna_Karenina.jpg',
    type: 'epub',
    addedAt: 1700000026000
  },
  {
    id: 'pub-wilde-picture-of-dorian-gray',
    name: 'The Picture of Dorian Gray',
    author: 'Oscar Wilde',
    fileName: 'Wilde_The_Picture_of_Dorian_Gray.epub',
    url: '/books/Wilde_The_Picture_of_Dorian_Gray.epub',
    coverImage: '/covers/Wilde_The_Picture_of_Dorian_Gray.jpg',
    type: 'epub',
    addedAt: 1700000027000
  },
  {
    id: 'pub-woolf-mrs-dalloway',
    name: 'Mrs. Dalloway',
    author: 'Virginia Woolf',
    fileName: 'Woolf_Mrs_Dalloway.epub',
    url: '/books/Woolf_Mrs_Dalloway.epub',
    coverImage: '/covers/Woolf_Mrs_Dalloway.jpg',
    type: 'epub',
    addedAt: 1700000028000
  },
  {
    id: 'pub-dumas-count-of-monte-cristo',
    name: 'The Count of Monte Cristo',
    author: 'Alexandre Dumas',
    fileName: 'Alexandre Dumas - The Count of Monte Cristo.epub',
    url: '/books/Alexandre Dumas - The Count of Monte Cristo.epub',
    coverImage: '/covers/Alexandre_Dumas_The_Count_of_Monte_Cristo.jpeg',
    type: 'epub',
    addedAt: 1700000029000
  },
  {
    id: 'pub-wells-time-machine',
    name: 'The Time Machine & The Invisible Man',
    author: 'H. G. Wells',
    fileName: 'H. G. Wells - The Time Machine and The Invisible Man.epub',
    url: '/books/H. G. Wells - The Time Machine and The Invisible Man.epub',
    coverImage: '/covers/H._G._Wells_The_Time_Machine_and_The_Invisible_Man.jpg',
    type: 'epub',
    addedAt: 1700000030000
  },
  {
    id: 'pub-tolstoy-war-and-peace',
    name: 'War and Peace',
    author: 'Leo Tolstoy',
    fileName: 'Leo Tolstoy - War and Peace.epub',
    url: '/books/Leo Tolstoy - War and Peace.epub',
    coverImage: '/covers/Leo_Tolstoy_War_and_Peace.jpg',
    type: 'epub',
    addedAt: 1700000031000
  },
  {
    id: 'pub-cervantes-don-quixote',
    name: 'Don Quixote',
    author: 'Miguel de Cervantes',
    fileName: 'Miguel de Cervantes - Don Quixote.epub',
    url: '/books/Miguel de Cervantes - Don Quixote.epub',
    coverImage: '/covers/Miguel_de_Cervantes_Don_Quixote.jpeg',
    type: 'epub',
    addedAt: 1700000032000
  },
  {
    id: 'pub-plato-symposium',
    name: 'Symposium',
    author: 'Plato',
    fileName: 'Plato - Symposium.epub',
    url: '/books/Plato - Symposium.epub',
    coverImage: '/covers/Plato_Symposium.jpeg',
    type: 'epub',
    addedAt: 1700000033000
  },
  {
    id: 'pub-plato-the-republic',
    name: 'The Republic',
    author: 'Plato',
    fileName: 'Plato - The Republic.epub',
    url: '/books/Plato - The Republic.epub',
    coverImage: '/covers/Plato_The_Republic.jpg',
    type: 'epub',
    addedAt: 1700000034000
  },
  {
    id: 'pub-bradbury-fahrenheit-451',
    name: 'Fahrenheit 451',
    author: 'Ray Bradbury',
    fileName: 'Ray Bradbury - Fahrenheit 451.epub',
    url: '/books/Ray Bradbury - Fahrenheit 451.epub',
    coverImage: '/covers/Ray_Bradbury_Fahrenheit_451.jpg',
    type: 'epub',
    addedAt: 1700000035000
  },
  {
    id: 'pub-sun-tzu-the-art-of-war',
    name: 'The Art of War',
    author: 'Sun Tzu',
    fileName: 'Sun Tzu - The Art of War.epub',
    url: '/books/Sun Tzu - The Art of War.epub',
    coverImage: '/covers/Sun_Tzu_The_Art_of_War.jpeg',
    type: 'epub',
    addedAt: 1700000036000
  },
  {
    id: 'sample-pdf',
    name: 'Aetherius: Architecture of Light',
    author: 'Aetherius Editorial',
    fileName: 'sample-pdf',
    url: 'sample-pdf',
    coverImage: null,
    type: 'pdf',
    addedAt: 1700000000000
  }
];

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
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveBook(name, type, data, coverImage = null) {
  const db = await getDB();
  const id = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const book = {
    id,
    name,
    size: data.byteLength,
    type,
    addedAt: Date.now(),
    data,
    coverImage,
    progressPercent: 0,
    lastLocation: null,
    lastReadAt: null
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(book);
    req.onsuccess = () => resolve(book);
    req.onerror = () => reject(req.error);
  });
}

export async function updateReadingProgress(id, progressPercent, lastLocation = null) {
  if (!id) return;
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progressPercent || 0)));
  const progressData = {
    progressPercent: roundedProgress,
    lastLocation,
    lastReadAt: Date.now()
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`book_progress_${id}`, JSON.stringify(progressData));
    } catch (e) {
      console.warn('Could not save progress to localStorage:', e);
    }
  }

  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.progressPercent = roundedProgress;
        record.lastLocation = lastLocation;
        record.lastReadAt = Date.now();
        store.put(record);
      }
    };
  } catch (err) {
    console.error('Error updating reading progress in IndexedDB:', err);
  }
}

export function getLocalProgress(id) {
  if (typeof window === 'undefined' || !id) return null;
  try {
    const raw = localStorage.getItem(`book_progress_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function getAllBooks() {
  try {
    const db = await getDB();
    const userBooks = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result.map(({ id, name, author, size, type, addedAt, coverImage, progressPercent, lastLocation, lastReadAt }) => {
          const localProg = getLocalProgress(id);
          return {
            id,
            name,
            author,
            size,
            type,
            addedAt,
            coverImage,
            progressPercent: localProg?.progressPercent ?? progressPercent ?? 0,
            lastLocation: localProg?.lastLocation ?? lastLocation ?? null,
            lastReadAt: localProg?.lastReadAt ?? lastReadAt ?? null
          };
        });
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });

    const allBooks = [...userBooks];
    for (const pub of PUBLIC_BOOKS) {
      if (!allBooks.some(b => b.id === pub.id)) {
        const localProg = getLocalProgress(pub.id);
        allBooks.push({
          ...pub,
          progressPercent: localProg?.progressPercent ?? 0,
          lastLocation: localProg?.lastLocation ?? null,
          lastReadAt: localProg?.lastReadAt ?? null
        });
      }
    }
    return allBooks;
  } catch (err) {
    console.error('Error listing books:', err);
    return PUBLIC_BOOKS.map(pub => {
      const localProg = getLocalProgress(pub.id);
      return {
        ...pub,
        progressPercent: localProg?.progressPercent ?? 0,
        lastLocation: localProg?.lastLocation ?? null,
        lastReadAt: localProg?.lastReadAt ?? null
      };
    });
  }
}

export async function getBookData(id) {
  const pub = PUBLIC_BOOKS.find(b => b.id === id);
  if (pub) {
    const localProg = getLocalProgress(id);
    
    // Check if cached in IndexedDB first
    try {
      const db = await getDB();
      const cached = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (cached && cached.data) {
        return {
          ...cached,
          progressPercent: localProg?.progressPercent ?? cached.progressPercent ?? 0,
          lastLocation: localProg?.lastLocation ?? cached.lastLocation ?? null
        };
      }
    } catch (e) {
      // ignore
    }

    if (pub.id === 'sample-pdf') {
      return {
        ...pub,
        data: 'sample-pdf',
        progressPercent: localProg?.progressPercent ?? 0,
        lastLocation: localProg?.lastLocation ?? null
      };
    }

    // Fetch arrayBuffer for public EPUB file
    try {
      const res = await fetch(pub.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();

      const record = {
        ...pub,
        data: arrayBuffer,
        progressPercent: localProg?.progressPercent ?? 0,
        lastLocation: localProg?.lastLocation ?? null
      };

      // Cache in IndexedDB for fast offline loading
      try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
      } catch (e) {}

      return record;
    } catch (err) {
      console.error(`Failed to fetch public book ${pub.url}:`, err);
      throw err;
    }
  }

  // Otherwise check user database
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const result = req.result;
      if (result) {
        const localProg = getLocalProgress(id);
        result.progressPercent = localProg?.progressPercent ?? result.progressPercent ?? 0;
        result.lastLocation = localProg?.lastLocation ?? result.lastLocation ?? null;
      }
      resolve(result || null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteBook(id) {
  if (PUBLIC_BOOKS.some(b => b.id === id)) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`book_progress_${id}`);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}
