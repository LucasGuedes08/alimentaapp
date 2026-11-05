import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Pegue os valores em Firebase Console > Configurações do projeto > Seus apps.
// Use o MESMO projeto no qual estão suas contas e o Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyAHPTXSCDiSH7nrJlbE9Owu1EgQ99jhP3A",
  authDomain: "alimentamaisapp.firebaseapp.com",
  projectId: "alimentamaisapp",
  storageBucket: "alimentamaisapp.firebasestorage.app",
  messagingSenderId: "556429850939",
  appId: "1:556429850939:web:03f9ad3487d46de8df5f1e",
  measurementId: "G-L7FLYPLKJL"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let auth;

try {
  auth = Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
} catch (erro) {
  if (erro.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw erro;
  }
}

export { app, auth };
