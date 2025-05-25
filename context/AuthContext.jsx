import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { generateSalt, hashPassword } from '../hooks/useHash';
import { createUser, getUserById, getUserByUsername } from '../services/authService';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from '@/database/schema';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth as firebaseAuth } from '../FirebaseConfig';

const USER_KEY = 'loggedUserId';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const db = useSQLiteContext();
  const drizzleDb = drizzle(db, { schema });

  useEffect(() => {
    void loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('[AuthContext] Load user error:', error);
    }
  };

  const register = async (email, password) => {
    try {
      const firebaseAuthResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const firebaseUser = firebaseAuthResult.user;

      await SecureStore.setItemAsync(USER_KEY, firebaseUser.uid);
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email });

      console.log('[AuthContext] Firebase registration success:', firebaseUser.email);
      return true;
    } catch (error) {
      console.log('[AuthContext] Firebase registration error:', error);
      return error;
    }
  };

  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = result.user;
      const userData = { uid: user.uid, email: user.email };

      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error('[Auth] Firebase login error:', error.code);
      throw error; // obsłużony w ekranie
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
      await signOut(firebaseAuth);

      setUser(null);
      router.replace('/');
      console.log('[AuthContext] Firebase logout success');
    } catch (error) {
      console.log('[AuthContext] Firebase logout error:', error);
    }
  };

  return <AuthContext.Provider value={{ user, register, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
