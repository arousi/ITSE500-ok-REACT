// Minimal IndexedDB helpers to persist app configuration (secret keys, selected models)
// IMPORTANT: Now scoped per owner (user or visitor) to prevent leaking keys across accounts.

const DB_NAME = 'app-config-db';
const DB_VERSION = 2; // bump to ensure upgrade path on existing installs
const STORE_KEYS = 'secret_keys';
const STORE_MODELS = 'selected_models';

function openDb() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_KEYS)) {
          db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_MODELS)) {
          db.createObjectStore(STORE_MODELS, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
    } catch (e) {
      reject(e);
    }
  });
}

// Compose a per-owner key id. Accepts raw owner key and prefixes it; fallback to 'local'.
function makeOwnerId(ownerKey) {
  const k = (ownerKey || '').trim();
  if (!k) return 'local';
  // Already prefixed? keep as is, else prefix so keys can't collide with legacy ids
  if (k.startsWith('user:') || k.startsWith('visitor:') || k.startsWith('owner:')) return k;
  return `owner:${k}`;
}

export async function loadSecretKeys(ownerKey) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_KEYS], 'readonly');
      const st = tx.objectStore(STORE_KEYS);
  const getReq = st.get(makeOwnerId(ownerKey));
      getReq.onsuccess = (ev) => resolve((ev.target.result && ev.target.result.value) || null);
      getReq.onerror = (err) => reject(err);
    });
  } catch (_) {
    return null;
  }
}

export async function saveSecretKeys(value, ownerKey) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_KEYS], 'readwrite');
      const st = tx.objectStore(STORE_KEYS);
  const putReq = st.put({ id: makeOwnerId(ownerKey), value });
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (err) => reject(err);
    });
  } catch (_) {
    return false;
  }
}

export async function loadSelectedModels(ownerKey) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MODELS], 'readonly');
      const st = tx.objectStore(STORE_MODELS);
  const getReq = st.get(makeOwnerId(ownerKey));
      getReq.onsuccess = (ev) => resolve((ev.target.result && ev.target.result.value) || []);
      getReq.onerror = (err) => reject(err);
    });
  } catch (_) {
    return [];
  }
}

export async function saveSelectedModels(models, ownerKey) {
  const cleaned = Array.isArray(models) ? models.filter(m => m && m.name).map(m => ({ name: m.name, provider: m.provider })) : [];
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_MODELS], 'readwrite');
      const st = tx.objectStore(STORE_MODELS);
  const putReq = st.put({ id: makeOwnerId(ownerKey), value: cleaned });
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = (err) => reject(err);
    });
  } catch (_) {
    return false;
  }
}
