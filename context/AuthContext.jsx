import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { auth as firebaseAuth } from '../FirebaseConfig';
import { performUpload } from '@/services/backupService';
import { resetPeriodicCheckTime } from '@/utils/periodicChecker';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setAuthIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthContext] Użytkownik zalogowany (Firebase):', firebaseUser.email);
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email };
        setUser(userData);
        await SecureStore.setItemAsync('lastUser', JSON.stringify(userData));
      } else {
        await SecureStore.deleteItemAsync('lastUser');
        setNeedsPinSetup(false);
        setUser(null);
      }
      setAuthIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const lockApp = () => {
    if (user) {
      console.log('[AuthContext] Aplikacja zablokowana.');
      setIsLocked(true);
    }
  };

  const unlockApp = () => {
    console.log('[AuthContext] Aplikacja odblokowana.');
    setIsLocked(false);
  };

  const register = async (email, password) => {
    try {
      const firebaseAuthResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      setNeedsPinSetup(true);

      return { success: true, user: firebaseAuthResult.user };
    } catch (error) {
      let message = 'Wystąpił błąd podczas rejestracji.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'Ten adres e-mail jest już używany!';
      } else {
        alert('Wystąpił błąd podczas rejestracji.');
      }
      console.log('[AuthContext] Błąd rejestracji Firebase:', error);
      return { success: false, error, message };
    }
  };

  const completeRegistration = () => {
    setNeedsPinSetup(false);
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      unlockApp();
      return { success: true };
    } catch (error) {
      let message = 'Nieprawidłowe dane logowania.';
      if (error.code === 'auth/invalid-email') {
        message = 'Niepoprawny adres e-mail!';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Nieprawidłowe hasło!';
      } else if (error.code === 'auth/user-not-found') {
        message = 'Nie znaleziono użytkownika o podanym adresie e-mail!';
      }
      console.log('[AuthContext] Błąd logowania Firebase:', error.code);
      return { success: false, error, message };
    }
  };
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);

    } catch (error) {
      console.error("[AuthContext] Błąd wysyłania e-maila resetującego hasło:", error.code);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await performUpload();
      await signOut(firebaseAuth);
      await SecureStore.deleteItemAsync('lastUser');
      await resetPeriodicCheckTime();
      console.log('[AuthContext] Użytkownik wylogowany');
    } catch (error) {
      console.log('[AuthContext] Błąd wylogowania Firebase:', error);
    } finally {
      setUser(null);
      setIsLocked(true);
      setNeedsPinSetup(false);
    }
  };

  const value = { user, isAuthLoading, needsPinSetup, register, login, logout, isLocked, lockApp, unlockApp, completeRegistration, forgotPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);