import { initializeApp, cert, applicationDefault, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let firebaseAdminApp: App | null = null;
let initError: string | null = null;

/**
 * Lazily initialize Firebase Admin SDK.
 * Follows strict best practices:
 * - Does not crash dev server on startup if credentials are missing.
 * - Supports FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or base64 JSON string)
 * - Supports FIREBASE_SERVICE_ACCOUNT_PATH (file path) or local serviceAccountKey.json
 * - Supports Google Application Default Credentials
 */
export function getFirebaseAdmin(): App | null {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    firebaseAdminApp = existingApps[0];
    return firebaseAdminApp;
  }

  try {
    let credential = null;
    let serviceAccountData: Record<string, unknown> | null = null;

    // 1. Check environment variable for direct JSON or Base64 string
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson && serviceAccountJson.trim()) {
      try {
        const decoded = serviceAccountJson.trim().startsWith('{')
          ? serviceAccountJson
          : Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
        serviceAccountData = JSON.parse(decoded);
      } catch (parseErr) {
        console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', parseErr);
      }
    }

    // 2. Check for serviceAccountKey.json file path
    const filePath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.resolve(process.cwd(), 'serviceAccountKey.json');

    if (!serviceAccountData && fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        serviceAccountData = JSON.parse(fileContent);
        console.log(`[Firebase Admin] Loaded service account from ${filePath}`);
      } catch (fileErr) {
        console.warn(`[Firebase Admin] Failed reading ${filePath}:`, fileErr);
      }
    }

    // 3. Create credential if service account is available
    if (serviceAccountData) {
      credential = cert(serviceAccountData);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = applicationDefault();
    }

    if (!credential) {
      initError = 'No Firebase service account credentials provided (FIREBASE_SERVICE_ACCOUNT_KEY or serviceAccountKey.json).';
      return null;
    }

    // Initialize with user's project details
    firebaseAdminApp = initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID || 'codepilot-aii',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'codepilot-aii.firebasestorage.app',
    });

    console.log('[Firebase Admin] Successfully initialized Firebase Admin SDK for project:', firebaseAdminApp.name);
    initError = null;
    return firebaseAdminApp;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[Firebase Admin] Initialization warning:', msg);
    initError = msg;
    return null;
  }
}

/**
 * Get Firebase Admin Auth service safely
 */
export function getAdminAuth(): Auth | null {
  const app = getFirebaseAdmin();
  return app ? getAuth(app) : null;
}

/**
 * Get Firebase Admin Firestore service safely
 */
export function getAdminFirestore(): Firestore | null {
  const app = getFirebaseAdmin();
  return app ? getFirestore(app) : null;
}

/**
 * Get Firebase Admin Status info
 */
export function getFirebaseAdminStatus(): {
  initialized: boolean;
  projectId: string;
  hasCredentials: boolean;
  error?: string | null;
} {
  const hasKey = Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) ||
    fs.existsSync(path.resolve(process.cwd(), 'serviceAccountKey.json')) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );

  const app = getFirebaseAdmin();

  return {
    initialized: Boolean(app),
    projectId: 'codepilot-aii',
    hasCredentials: hasKey,
    error: initError,
  };
}
