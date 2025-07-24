// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { initializeAuth, getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBWVU-rZw8BfqnwGcOsnBeaTH9d_TVPVJk",
  authDomain: "stockaleta.firebaseapp.com",
  projectId: "stockaleta",
  storageBucket: "stockaleta.appspot.com",
  messagingSenderId: "219589028138",
  appId: "1:219589028138:web:c50bf9239c55c943c99653"
};

const app = initializeApp(firebaseConfig);

// 👇 Esto es lo que evita que Hermes rompa todo
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
