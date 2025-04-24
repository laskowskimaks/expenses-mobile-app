import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { generateSalt, hashPassword } from '../hooks/useHash';
import { createUser, getUserById, getUserByUsername } from '../services/authService';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const USER_ID_KEY = 'loggedUserId';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const db = useSQLiteContext();
  const [user, setUser] = useState(null);

  useEffect(() => {
    void loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedId = await SecureStore.getItemAsync(USER_ID_KEY);
      console.log('[AuthContext] Loaded user ID from storage:', storedId);

      if (storedId) {
        const loadedUser = await getUserById(db, parseInt(storedId));
        if (loadedUser) {
          console.log('[AuthContext] Logged in from storage:', loadedUser.email);
          setUser(loadedUser);

          router.replace('/(tabs)/home');
        }
      }

      console.log('[AuthContext] No user found in storage');
    } catch (error) {
      console.error('[AuthContext] Error loading user from storage:', error);
    }
  };
  const register = async (username, password) => {
    try {
      const salt = generateSalt();
      const hashed = await hashPassword(password, salt);
      const success = await createUser(db, username, hashed, salt);
  
      if (success) {
        console.log('[AuthContext] Registration success');
        return true;
      } else {
        console.log('[AuthContext] Registration failed');
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      return false;
    }
  };
  
  const login = async (username, password) => {
    try {
      const userFromDB = await getUserByUsername(db, username);  
      if (!userFromDB) {
        console.log('[AuthContext] Login failed: user not found');
        return false;
      }
  
      const hashedInput = await hashPassword(password, userFromDB.salt);
  
      if (hashedInput === userFromDB.password) {
        setUser(userFromDB);
        await SecureStore.setItemAsync(USER_ID_KEY, userFromDB.id.toString());
  
        console.log('[AuthContext] Login success:', username);
        return true;
      } else {
        console.log('[AuthContext] Login failed: incorrect password');
        return false;
      }
    } catch (error) {
      console.log('[AuthContext] Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      setUser(null);
      console.log('[AuthContext] Logged out');
      router.replace('/');
      alert('Wylogowano');
    } catch (error) {
      console.log('[AuthContext] Error during logout:', error);
    }
  };

  return <AuthContext.Provider value={{ user, register, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
