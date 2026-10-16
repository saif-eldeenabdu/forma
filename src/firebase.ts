import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get } from 'firebase/database';

export const firebaseConfig = {
  projectId: "forma-89762",
  appId: "1:342238258135:web:d4a04b5da4b17a78422192",
  databaseURL: "https://forma-89762-default-rtdb.firebaseio.com",
  storageBucket: "forma-89762.firebasestorage.app",
  apiKey: "AIzaSyA81K6s2a8w1X6p_M2uWSIChc5yU0i4TFM",
  authDomain: "forma-89762.firebaseapp.com",
  messagingSenderId: "342238258135",
  measurementId: "G-55RWLLQ840",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export { ref, onValue, set, update, get };
