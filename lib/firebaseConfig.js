import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Le chiavi vengono lette dal file .env (non versionato su git).
// Trovi la procedura passo-passo per crearle nel file README.md di questo
// progetto (è gratuita e richiede circa 5 minuti) — copia .env.example in
// .env e incolla lì i tuoi valori.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

let signInPromise = null;

// Login anonimo: non serve email/password. Serve solo per rispettare le
// regole di sicurezza di Firestore (vedi README). L'accesso ai dati
// condivisi è comunque protetto dal "codice famiglia" di ogni household.
export function ensureAnonymousAuth() {
  const auth = getAuth(app);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then((cred) => cred.user)
      .catch((error) => {
        signInPromise = null;
        throw error;
      });
  }
  return signInPromise;
}
