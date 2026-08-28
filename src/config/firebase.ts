import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export interface FirebaseConfigKeys {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function getStoredFirebaseConfig(): FirebaseConfigKeys | null {
  try {
    const saved = localStorage.getItem('cepr_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(e);
  }

  // Check Vite Env safely
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_FIREBASE_API_KEY && metaEnv.VITE_FIREBASE_PROJECT_ID) {
    return {
      apiKey: metaEnv.VITE_FIREBASE_API_KEY,
      authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: metaEnv.VITE_FIREBASE_PROJECT_ID,
      storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: metaEnv.VITE_FIREBASE_APP_ID || '',
    };
  }

  return null;
}

let dbInstance: ReturnType<typeof getFirestore> | null = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (e) {
    console.error('Erro ao inicializar Firebase:', e);
    return null;
  }
}

export function getFirebaseDb() {
  if (!dbInstance) {
    return initFirebase();
  }
  return dbInstance;
}
