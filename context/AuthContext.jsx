import React, { createContext, useState, useContext } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { generateSalt, hashPassword } from '../hooks/useHash';
import { createUser, getUserByEmail } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const db = useSQLiteContext();
  const [user, setUser] = useState(null);

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
    const userFromDB = await getUserByEmail(db, email);

    if (!userFromDB) {
      console.log('[AuthContext] Login failed: user not found');
      return false;
    }

    const hashedInput = await hashPassword(password, userFromDB.salt);

    if (hashedInput === userFromDB.password) {
      setUser(userFromDB);
      console.log('[AuthContext] Login success:', email);

      return true;
      
    } else {
      console.log('[AuthContext] Login failed: incorrect password');
      
      return false;
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
