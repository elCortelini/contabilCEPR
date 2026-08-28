import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

export interface FirebaseConfigKeys {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Credentials extracted from user's Firebase project: cepr-contabil
const DEFAULT_FIREBASE_CONFIG: FirebaseConfigKeys = {
  apiKey: "AIzaSyAqb9Dg06UJALLvSsStPLssS8t6-uQYWgo",
  authDomain: "cepr-contabil.firebaseapp.com",
  projectId: "cepr-contabil",
  storageBucket: "cepr-contabil.firebasestorage.app",
  messagingSenderId: "900310273756",
  appId: "1:900310273756:web:b83fd18b29c9991097ee19"
};

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

  return DEFAULT_FIREBASE_CONFIG;
}

let appInstance: any = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;
let authInstance: ReturnType<typeof getAuth> | null = null;

export function initFirebase() {
  const config = getStoredFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    appInstance = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return dbInstance;
  } catch (e) {
    console.error('Erro ao inicializar Firebase:', e);
    return null;
  }
}

export function getFirebaseDb() {
  if (!dbInstance) {
    initFirebase();
  }
  return dbInstance;
}

export function getFirebaseAuth() {
  if (!authInstance) {
    initFirebase();
  }
  return authInstance;
}

export const googleProvider = new GoogleAuthProvider();
export { signInWithPopup, signOut, onAuthStateChanged };
