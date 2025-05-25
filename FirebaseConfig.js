// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzdbjy4vfcjBg0yuZNpUowVfnu9xPRA2Y",
  authDomain: "expenses-app-5885e.firebaseapp.com",
  projectId: "expenses-app-5885e",
  storageBucket: "expenses-app-5885e.firebasestorage.app",
  messagingSenderId: "540502826410",
  appId: "1:540502826410:web:bd97c2b1ee0ea07b83dfd3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);