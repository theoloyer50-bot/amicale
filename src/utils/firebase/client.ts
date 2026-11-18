import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';

// Firebase Web API keys are public identifiers; database access is protected by RTDB rules.
export const firebaseConfig = {
  apiKey: 'AIzaSyCQDgy5ZF9-uwigC0UjgX0T-rk2kALOXl4',
  authDomain: 'amicale-tourlaville.firebaseapp.com',
  databaseURL: 'https://amicale-tourlaville-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'amicale-tourlaville',
  appId: '1:401064786999:web:290368e0a139851fafd3b2',
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firebaseDatabase: Database = getDatabase(firebaseApp);

export function createIsolatedFirebaseApp(name: string): FirebaseApp {
  return initializeApp(firebaseConfig, name);
}
