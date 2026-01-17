import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // 1. Check if keys exist before trying to use them
  if (!process.env.FIREBASE_PROJECT_ID || 
      !process.env.FIREBASE_CLIENT_EMAIL || 
      !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("❌ MISSING FIREBASE ADMIN KEYS in .env.local");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fixes the newline issue common with Vercel/Env variables
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = admin.firestore();

export { adminDb };