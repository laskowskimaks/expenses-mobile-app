import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth as firebaseAuth } from '../FirebaseConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setAuthIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      // Zalogowany online
      if (firebaseUser) {
        console.log('[AuthContext] Użytkownik zalogowany (Firebase):', firebaseUser.email);
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email };
        setUser(userData);
        await SecureStore.setItemAsync('lastUser', JSON.stringify(userData));
      } else {
        await SecureStore.deleteItemAsync('lastUser');
        setUser(null);
      }
      setAuthIsLoading(false);
    });

    return () => unsubscribe(); // Sprzątanie po odmontowaniu komponentu
  }, []);

  const register = async (email, password) => {
    try {
      const firebaseAuthResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return { success: true, user: firebaseAuthResult.user };
    } catch (error) {
      console.log('[AuthContext] Błąd rejestracji Firebase:', error);
      return { success: false, error };
    }
  };

  const login = async (email, password) => {
    // loguje w Firebase.
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      return true;
    } catch (error) {
      console.error('[AuthContext] Błąd logowania Firebase:', error.code);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
      await SecureStore.deleteItemAsync('lastUser');
      setUser(null);
      console.log('[AuthContext] Użytkownik wylogowany');
      router.replace('/');
    } catch (error) {
      console.log('[AuthContext] Błąd wylogowania Firebase:', error);
    }
  };

  const value = { user, isAuthLoading, register, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);