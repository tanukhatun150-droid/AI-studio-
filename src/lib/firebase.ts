// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) || "AIzaSyDX835Pi2KFcAoXJiMtu_Y-JG2Oj3xVFeY",
  authDomain: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) || "codepilot-aii.firebaseapp.com",
  projectId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) || "codepilot-aii",
  storageBucket: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) || "codepilot-aii.firebasestorage.app",
  messagingSenderId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) || "153889116171",
  appId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) || "1:153889116171:web:01f097e3d5c1c8a2b8b70e",
  measurementId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID) || "G-CPH0PLNY37"
};

// Initialize Firebase (singleton pattern prevents duplicate app init)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics safely for web environments
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("[Firebase] Analytics initialized successfully:", firebaseConfig.measurementId);
    }
  }).catch((err) => {
    console.warn("[Firebase] Analytics isSupported check:", err);
  });
}

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure provider custom parameters
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Helper to map a Firebase User object to our app's UserProfile
 */
export function mapFirebaseUserToProfile(user: FirebaseUser): {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'firebase' | 'google' | 'github' | 'email';
  emailVerified: boolean;
  createdAt: string;
} {
  const providerId = user.providerData[0]?.providerId || 'firebase';
  let provider: 'firebase' | 'google' | 'github' | 'email' = 'firebase';
  if (providerId.includes('google')) provider = 'google';
  else if (providerId.includes('github')) provider = 'github';
  else if (providerId.includes('password')) provider = 'email';

  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || 'Firebase User',
    email: user.email || 'user@codepilot.ai',
    avatar:
      user.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email || user.uid)}`,
    provider,
    emailVerified: user.emailVerified,
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

/**
 * Format Firebase Auth errors into clear, actionable messages
 */
export function formatFirebaseError(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';
  const code = (err as { code?: string })?.code || '';
  const message = (err as { message?: string })?.message || String(err);

  switch (code) {
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      return `Domain "${host}" is not authorized in Firebase. Add "${host}" to Firebase Console > Authentication > Settings > Authorized domains, or use Email & Password below!`;
    }
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.';
    case 'auth/user-not-found':
      return 'No account registered with this email. Please create an account.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups or open the app in a new tab.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Console (Authentication > Sign-in method).';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access has been temporarily restricted. Try again later.';
    default:
      return message.replace('Firebase: ', '').replace(/\s*\([a-z0-9/-]+\)\.?/i, '');
  }
}

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  firebaseSignOut,
  onAuthStateChanged,
};
export type { FirebaseUser };
