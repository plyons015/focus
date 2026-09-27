import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, signOut, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';

export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
}

export function readFirebaseEnv(): FirebaseEnv | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function firebaseServices(env: FirebaseEnv): { auth: Auth; db: Firestore } {
  if (!app) {
    app = initializeApp(env);
    auth = getAuth(app);
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      });
    } catch {
      db = getFirestore(app);
    }
  }
  return { auth: auth!, db: db! };
}

export function watchUser(authRef: Auth, onUser: (uid: string | null) => void): () => void {
  return onAuthStateChanged(authRef, (user) => onUser(user?.uid ?? null));
}

export async function signInEmail(authRef: Auth, email: string, password: string, create: boolean): Promise<void> {
  if (create) await createUserWithEmailAndPassword(authRef, email, password);
  else await signInWithEmailAndPassword(authRef, email, password);
}

export async function signInGoogle(authRef: Auth): Promise<void> {
  await signInWithPopup(authRef, new GoogleAuthProvider());
}

export async function signOutUser(authRef: Auth): Promise<void> {
  await signOut(authRef);
}

export async function pingSync(authRef: Auth | null): Promise<void> {
  const url = import.meta.env.VITE_ZIGZAG_SYNC_URL?.trim();
  if (!url || !authRef?.currentUser) return;
  const token = await authRef.currentUser.getIdToken();
  await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}
