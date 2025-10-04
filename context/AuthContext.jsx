import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail
} from "firebase/auth";
import { auth as firebaseAuth } from '../FirebaseConfig';
import { DB_TIMESTAMP_KEY, performUpload } from '@/services/backupService';
import { resetPeriodicCheckTime } from '@/utils/periodicChecker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDb } from './DbContext';
import { getUserEmail, updateLocalEmail } from '@/services/authService';
import { useNetworkStatus } from './NetworkContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setAuthIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(true);
  const [needsPinSetup, setNeedsPinSetup] = useState(false);
  const [isExternalActivity, setIsExternalActivity] = useState(false);
  const { isConnected } = useNetworkStatus();
  const { db } = useDb();

  const refreshUser = async () => {
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      try {
        await currentUser.reload();
        return { success: true, currentUser };
      } catch (error) {
        if (error.code === 'auth/user-token-expired') {
          console.log('[AuthContext] Token użytkownika wygasł - to oczekiwane po zmianie e-maila.');
        } else {
          console.error('[AuthContext] Błąd podczas odświeżania danych użytkownika:', error);
        }
        return { success: false, error: error };
      }
    }
    return { success: false, error: null };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('[AuthContext] Użytkownik zalogowany (Firebase):', firebaseUser.email);
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email };
        setUser(userData);
        await SecureStore.setItemAsync('lastUser', JSON.stringify(userData));

        if (db) {
          const localEmail = await getUserEmail(db);
          if (localEmail && localEmail !== firebaseUser.email) {
            console.log(`[AuthContext] Wykryto zmianę e-maila. Aktualizuję lokalną bazę...`);
            await updateLocalEmail(db, firebaseUser.email);
          }
        }

      } else {
        await SecureStore.deleteItemAsync('lastUser');
        setNeedsPinSetup(false);
        setUser(null);
      }
      setAuthIsLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

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
        message = 'Wystąpił błąd podczas rejestracji.';
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

  const changePassword = async (currentPassword, newPassword) => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) {
      return { success: false, message: 'Użytkownik nie jest zalogowany.' };
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      return { success: true };
    } catch (error) {
      console.log('[AuthContext] Błąd zmiany hasła:', error.code);
      if (error.code === 'auth/wrong-password') {
        return { success: false, message: 'Nieprawidłowe aktualne hasło.' };
      }
      if (error.code === 'auth/network-request-failed') {
        return { success: false, message: 'Błąd sieci. Sprawdź połączenie z internetem.' };
      }
      return { success: false, message: error.code };
    }
  };

  const changeEmail = async (newEmail, currentPassword) => {
    const firebaseUser = firebaseAuth.currentUser;
    if (!firebaseUser) {
      return { success: false, message: 'Użytkownik nie jest zalogowany.' };
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await verifyBeforeUpdateEmail(firebaseUser, newEmail);
      return { success: true };
    } catch (error) {
      console.log('[AuthContext] Błąd zmiany adresu e-mail:', error.code);
      return { success: false, message: error.code };
    }
  };

  const logoutAfterAction = async () => {
    try {
      console.log('[AuthContext] Rozpoczynanie czystego wylogowania po akcji...');
      await resetPeriodicCheckTime();
      await AsyncStorage.removeItem(DB_TIMESTAMP_KEY);
      try {
        await SecureStore.deleteItemAsync('lastUser');
      } catch (err) {
        console.error('[AuthContext] Błąd usuwania z SecureStore podczas logoutAfterAction:', err);
      }
    } catch (error) {
      console.log('[AuthContext] Błąd podczas czyszczenia danych po akcji:', error);
    } finally {
      try {
        await signOut(firebaseAuth);
        console.log('[AuthContext] Użytkownik wylogowany z Firebase.');
      } catch (err) {
        console.error('[AuthContext] Błąd podczas wylogowania z Firebase:', err);
      }
    }
  };

  const logout = async () => {
    try {
      if (firebaseAuth.currentUser && isConnected) {
        try {
          await performUpload();
        } catch (err) {
          console.error('[AuthContext] Błąd podczas uploadu backupu:', err);
        }
      } else if (!isConnected) {
        console.log('[AuthContext] Brak internetu - pomijam upload backupu.');
      }
      await resetPeriodicCheckTime();
      await AsyncStorage.removeItem(DB_TIMESTAMP_KEY);
      try {
        await SecureStore.deleteItemAsync('lastUser');
      } catch (err) {
        console.error('[AuthContext] Błąd usuwania z SecureStore podczas logout:', err);
      }
    } catch (error) {
      console.log('[AuthContext] Błąd podczas operacji przed wylogowaniem:', error);
    } finally {
      try {
        await signOut(firebaseAuth);
        console.log('[AuthContext] Użytkownik wylogowany z Firebase.');
      } catch (err) {
        console.error('[AuthContext] Błąd podczas wylogowania z Firebase:', err);
      }
      setUser(null);
    }
  };

  const value = { user, isAuthLoading, needsPinSetup, register, login, logout, logoutAfterAction, isLocked, lockApp, unlockApp, completeRegistration, forgotPassword, changePassword, changeEmail, refreshUser, isExternalActivity, setIsExternalActivity };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);