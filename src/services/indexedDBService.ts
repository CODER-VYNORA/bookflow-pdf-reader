import { Book, Bookmark, Highlight, Note, ReaderSettings } from '../types';

const DB_NAME = 'RealisticPdfReaderDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Books store
      if (!db.objectStoreNames.contains('books')) {
        const bookStore = db.createObjectStore('books', { keyPath: 'id' });
        bookStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        bookStore.createIndex('name', 'name', { unique: false });
      }

      // Bookmarks store
      if (!db.objectStoreNames.contains('bookmarks')) {
        const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
        bmStore.createIndex('bookId', 'bookId', { unique: false });
        bmStore.createIndex('bookPage', ['bookId', 'pageNumber'], { unique: false });
      }

      // Highlights store
      if (!db.objectStoreNames.contains('highlights')) {
        const hlStore = db.createObjectStore('highlights', { keyPath: 'id' });
        hlStore.createIndex('bookId', 'bookId', { unique: false });
        hlStore.createIndex('bookPage', ['bookId', 'pageNumber'], { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('bookId', 'bookId', { unique: false });
        noteStore.createIndex('bookPage', ['bookId', 'pageNumber'], { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Reading progress store (v2). Kept separate so future migrations can
      // evolve progress independently from the book metadata.
      if (!db.objectStoreNames.contains('readingProgress')) {
        const progressStore = db.createObjectStore('readingProgress', { keyPath: 'bookId' });
        progressStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Helper for transactions
async function performTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = callback(store);

    transaction.oncomplete = () => {
      if (request && 'result' in request) {
        resolve(request.result);
      } else {
        resolve(undefined as unknown as T);
      }
    };

    transaction.onerror = () => reject(transaction.error);
    if (request) {
      request.onerror = () => reject(request.error);
    }
  });
}

// BOOKS API
export async function getAllBooks(): Promise<Book[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', 'readonly');
    const store = tx.objectStore('books');
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev'); // Most recently read/updated first
    const books: Book[] = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        books.push(cursor.value);
        cursor.continue();
      } else {
        resolve(books);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getBookById(id: string): Promise<Book | null> {
  return performTransaction<Book | null>('books', 'readonly', (store) =>
    store.get(id)
  ).then((res) => res || null);
}

export async function saveBook(book: Book): Promise<void> {
  try {
    await performTransaction('books', 'readwrite', (store) => store.put(book));
  } catch (error: any) {
    if (error?.name === 'QuotaExceededError') {
      throw new Error('Browser storage is full. Delete an unused PDF or free some device storage and try again.');
    }
    throw error;
  }
}

export async function updateBookProgress(
  id: string,
  lastReadPage: number
): Promise<void> {
  const book = await getBookById(id);
  if (book) {
    book.lastReadPage = lastReadPage;
    book.updatedAt = Date.now();
    await saveBook(book);
  }
}

export async function renameBook(id: string, newName: string): Promise<void> {
  const book = await getBookById(id);
  if (book) {
    book.name = newName.trim();
    book.updatedAt = Date.now();
    await saveBook(book);
  }
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  // Delete book and cascading bookmarks, highlights, notes
  const tx = db.transaction(['books', 'bookmarks', 'highlights', 'notes'], 'readwrite');
  tx.objectStore('books').delete(id);

  // Delete bookmarks
  const bmStore = tx.objectStore('bookmarks');
  const bmIndex = bmStore.index('bookId');
  const bmReq = bmIndex.openKeyCursor(IDBKeyRange.only(id));
  bmReq.onsuccess = () => {
    const cursor = bmReq.result;
    if (cursor) {
      bmStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  // Delete highlights
  const hlStore = tx.objectStore('highlights');
  const hlIndex = hlStore.index('bookId');
  const hlReq = hlIndex.openKeyCursor(IDBKeyRange.only(id));
  hlReq.onsuccess = () => {
    const cursor = hlReq.result;
    if (cursor) {
      hlStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  // Delete notes
  const noteStore = tx.objectStore('notes');
  const noteIndex = noteStore.index('bookId');
  const noteReq = noteIndex.openKeyCursor(IDBKeyRange.only(id));
  noteReq.onsuccess = () => {
    const cursor = noteReq.result;
    if (cursor) {
      noteStore.delete(cursor.primaryKey);
      cursor.continue();
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// BOOKMARKS API
export async function getBookmarksForBook(bookId: string): Promise<Bookmark[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bookmarks', 'readonly');
    const store = tx.objectStore('bookmarks');
    const index = store.index('bookId');
    const request = index.getAll(IDBKeyRange.only(bookId));

    request.onsuccess = () => {
      const list = request.result || [];
      // Sort by page number ascending
      list.sort((a, b) => a.pageNumber - b.pageNumber);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  await performTransaction('bookmarks', 'readwrite', (store) => store.put(bookmark));
}

export async function deleteBookmark(id: string): Promise<void> {
  await performTransaction('bookmarks', 'readwrite', (store) => store.delete(id));
}

// HIGHLIGHTS API
export async function getHighlightsForBook(bookId: string): Promise<Highlight[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('highlights', 'readonly');
    const store = tx.objectStore('highlights');
    const index = store.index('bookId');
    const request = index.getAll(IDBKeyRange.only(bookId));

    request.onsuccess = () => {
      const list = request.result || [];
      list.sort((a, b) => a.pageNumber - b.pageNumber || a.createdAt - b.createdAt);
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getHighlightsForPage(bookId: string, pageNumber: number): Promise<Highlight[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('highlights', 'readonly');
    const store = tx.objectStore('highlights');
    const index = store.index('bookPage');
    const request = index.getAll(IDBKeyRange.only([bookId, pageNumber]));

    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveHighlight(highlight: Highlight): Promise<void> {
  await performTransaction('highlights', 'readwrite', (store) => store.put(highlight));
}

export async function deleteHighlight(id: string): Promise<void> {
  await performTransaction('highlights', 'readwrite', (store) => store.delete(id));
}

// SETTINGS API
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const res = await performTransaction<{ key: string; value: T } | undefined>(
      'settings',
      'readonly',
      (store) => store.get(key)
    );
    return res ? res.value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  await performTransaction('settings', 'readwrite', (store) =>
    store.put({ key, value })
  );
}
