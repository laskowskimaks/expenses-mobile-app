import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { generateSalt, hashPassword } from '../hooks/useHash';
import { createUser, getUserByEmail, getUserById } from '../services/authService';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const USER_ID_KEY = 'loggedUserId';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const db = useSQLiteContext();
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    const storedId = await SecureStore.getItemAsync(USER_ID_KEY);
    console.log('[AUTO LOGIN] Loaded user ID from storage:', storedId);

    if (storedId) {
      const loadedUser = await getUserById(db, parseInt(storedId));
      if (loadedUser) {
        console.log('[AUTO LOGIN] Logged in from storage:', loadedUser.email);
        setUser(loadedUser);

        router.replace('/(tabs)/home');
        return true;
      }
    }
    console.log('[AUTO LOGIN] No user found in storage');
    return false;
  };

  const register = async (email, password) => {
    const salt = generateSalt();
    const hashed = await hashPassword(password, salt);
    const success = await createUser(db, email, hashed, salt);

    if (success) {
      console.log('[AuthContext] Registration success');
      return true;
    } else {
      console.log('[AuthContext] Registration failed');
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const userFromDB = await getUserByEmail(db, email);

      if (!userFromDB) {
        console.log('[AuthContext] Login failed: user not found');
        return false;
      }

      const hashedInput = await hashPassword(password, userFromDB.salt);

      if (hashedInput === userFromDB.password) {
        setUser(userFromDB);
        await SecureStore.setItemAsync(USER_ID_KEY, userFromDB.id.toString());

        console.log('[AuthContext] Login success:', email);
        return true;
      } else {
        console.log('[AuthContext] Login failed: incorrect password');
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setUser(null);
    console.log('[LOGOUT] Logged out');
    router.replace('/');
    alert('Wylogowano');
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);