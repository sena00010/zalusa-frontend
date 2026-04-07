// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, getRedirectResult } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhpBPKmk2DusQjrBgAK2hlZQmb-xjFkIc",
  authDomain: "zalusa-4ddf3.firebaseapp.com",
  projectId: "zalusa-4ddf3",
  storageBucket: "zalusa-4ddf3.firebasestorage.app",
  messagingSenderId: "490095278774",
  appId: "1:490095278774:web:e5820e578b28ce64610417",
  measurementId: "G-H73F9V23CK"
};

// Initialize Firebase (prevent duplicate init on hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ── FIX: "Pending promise was never set" hatası ──
// Tarayıcıda kalmış eski redirect result'ı temizle
// Bu, local development'ta HMR sonrası oluşan stale state'i çözer
if (typeof window !== "undefined") {
  getRedirectResult(auth).catch(() => {
    // Sessizce geç — stale redirect state temizlendi
  });
}

export default app;