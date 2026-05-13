import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: "h4i-applications.firebaseapp.com",
  projectId: "h4i-applications",
  storageBucket: "h4i-applications.firebasestorage.app",
  messagingSenderId: "361966602736",
  appId: "1:361966602736:web:05a21adddb85e54eebf535",
  measurementId: "G-FS170BH0BM",
};

export const API_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:5001/h4i-applications/us-east4/api"
    : "https://api-4orgfxckcq-uk.a.run.app";

console.log(`CURRENTLY RUNNING IN ${import.meta.env.MODE} MODE!`);
console.log(`Using base API URL at: ${API_URL}`);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

declare global {
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

if (import.meta.env.MODE === "development") {
  console.warn("====USING APPCHECK DEBUG TOKEN====");
  console.warn(
    "IMPORTANT: The app won't work locally if this token is not registered!",
  );
  console.warn(
    "Read the docs for debug tokens here: https://firebase.google.com/docs/app-check/web/debug-provider#web",
  );
  self.FIREBASE_APPCHECK_DEBUG_TOKEN =
    import.meta.env.VITE_APPCHECK_DEBUG_TOKEN ?? true;
}

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(SITE_KEY),
  isTokenAutoRefreshEnabled: true,
});

export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (import.meta.env.MODE === "development") {
  console.log(`CONNECTING TO LOCAL FIREBASE EMULATORS!`);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}
