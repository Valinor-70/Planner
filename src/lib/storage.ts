import type { Task, StorageMetadata, StorageEngine } from '../types';

const DB_NAME = 'planner-db';
const DB_VERSION = 1;
const TASK_STORE = 'tasks';
const META_STORE = 'metadata';
const LOCALSTORAGE_KEY = 'planner-tasks';
const META_KEY = 'planner-meta';
const CURRENT_SCHEMA_VERSION = 1;

let db: IDBDatabase | null = null;
let storageEngine: StorageEngine = 'indexeddb';

// Initialize IndexedDB
export async function initDB(): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    console.warn('IndexedDB not available, falling back to localStorage');
    storageEngine = 'localstorage';
    return;
  }

  try {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('IndexedDB failed, falling back to localStorage');
        storageEngine = 'localstorage';
        resolve();
      };

      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result;
        storageEngine = 'indexeddb';
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        
        if (!database.objectStoreNames.contains(TASK_STORE)) {
          const taskStore = database.createObjectStore(TASK_STORE, { keyPath: 'id' });
          taskStore.createIndex('order', 'order', { unique: false });
          taskStore.createIndex('completed', 'completed', { unique: false });
        }

        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: 'key' });
        }
      };
    });
  } catch (error) {
    console.warn('IndexedDB initialization failed, using localStorage:', error);
    storageEngine = 'localstorage';
  }
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  if (storageEngine === 'localstorage') {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  if (!db) await initDB();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([TASK_STORE], 'readonly');
    const store = transaction.objectStore(TASK_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save task
export async function saveTask(task: Task): Promise<void> {
  if (storageEngine === 'localstorage') {
    const tasks = await getAllTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(tasks));
    await updateMetadata();
    return;
  }

  if (!db) await initDB();
  if (!db) throw new Error('Database not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([TASK_STORE], 'readwrite');
    const store = transaction.objectStore(TASK_STORE);
    const request = store.put(task);

    request.onsuccess = async () => {
      await updateMetadata();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Delete task
export async function deleteTask(id: string): Promise<void> {
  if (storageEngine === 'localstorage') {
    const tasks = await getAllTasks();
    const filtered = tasks.filter(t => t.id !== id);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(filtered));
    await updateMetadata();
    return;
  }

  if (!db) await initDB();
  if (!db) throw new Error('Database not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([TASK_STORE], 'readwrite');
    const store = transaction.objectStore(TASK_STORE);
    const request = store.delete(id);

    request.onsuccess = async () => {
      await updateMetadata();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Get metadata
export async function getMetadata(): Promise<StorageMetadata> {
  if (storageEngine === 'localstorage') {
    const data = localStorage.getItem(META_KEY);
    return data ? JSON.parse(data) : {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastModified: new Date().toISOString()
    };
  }

  if (!db) await initDB();
  if (!db) return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastModified: new Date().toISOString()
  };

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([META_STORE], 'readonly');
    const store = transaction.objectStore(META_STORE);
    const request = store.get('metadata');

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.value);
      } else {
        resolve({
          schemaVersion: CURRENT_SCHEMA_VERSION,
          lastModified: new Date().toISOString()
        });
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Update metadata
async function updateMetadata(): Promise<void> {
  const metadata: StorageMetadata = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastModified: new Date().toISOString()
  };

  if (storageEngine === 'localstorage') {
    localStorage.setItem(META_KEY, JSON.stringify(metadata));
    return;
  }

  if (!db) return;

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([META_STORE], 'readwrite');
    const store = transaction.objectStore(META_STORE);
    const request = store.put({ key: 'metadata', value: metadata });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Export all data
export async function exportData(): Promise<{ tasks: Task[], metadata: StorageMetadata }> {
  const tasks = await getAllTasks();
  const metadata = await getMetadata();
  return { tasks, metadata };
}

// Import data
export async function importData(data: { tasks: Task[], metadata?: StorageMetadata }): Promise<void> {
  if (storageEngine === 'localstorage') {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data.tasks));
    if (data.metadata) {
      localStorage.setItem(META_KEY, JSON.stringify(data.metadata));
    }
    return;
  }

  if (!db) await initDB();
  if (!db) throw new Error('Database not initialized');

  const transaction = db.transaction([TASK_STORE, META_STORE], 'readwrite');
  const taskStore = transaction.objectStore(TASK_STORE);
  const metaStore = transaction.objectStore(META_STORE);

  // Clear existing data
  await new Promise<void>((resolve, reject) => {
    const clearRequest = taskStore.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  // Add imported tasks
  for (const task of data.tasks) {
    await new Promise<void>((resolve, reject) => {
      const addRequest = taskStore.add(task);
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  // Update metadata
  if (data.metadata) {
    await new Promise<void>((resolve, reject) => {
      const metaRequest = metaStore.put({ key: 'metadata', value: data.metadata });
      metaRequest.onsuccess = () => resolve();
      metaRequest.onerror = () => reject(metaRequest.error);
    });
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  if (storageEngine === 'localstorage') {
    localStorage.removeItem(LOCALSTORAGE_KEY);
    localStorage.removeItem(META_KEY);
    return;
  }

  if (!db) await initDB();
  if (!db) throw new Error('Database not initialized');

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([TASK_STORE, META_STORE], 'readwrite');
    const taskStore = transaction.objectStore(TASK_STORE);
    const metaStore = transaction.objectStore(META_STORE);

    taskStore.clear();
    metaStore.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export function getStorageEngine(): StorageEngine {
  return storageEngine;
}
