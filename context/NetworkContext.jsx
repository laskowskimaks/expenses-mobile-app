import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const internetReachable = state.isConnected != null && state.isInternetReachable != null
        ? state.isInternetReachable
        : false;

      setIsConnected(internetReachable);
      console.log('[NetworkContext] Status połączenia z internetem:', internetReachable);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const value = { isConnected };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkStatus = () => {
  const context = useContext(NetworkContext);
  if (context === null) {
    throw new Error('useNetworkStatus musi być używany wewnątrz NetworkProvider');
  }
  return context;
};
