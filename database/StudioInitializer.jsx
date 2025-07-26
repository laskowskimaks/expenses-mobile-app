import React from 'react';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';


const StudioInitializer = ({ sqliteConn }) => {
  if (__DEV__) {
    useDrizzleStudio(sqliteConn);
    console.log('[StudioInitializer] Drizzle Studio aktywne (DEV mode)');
  }
  return null;
};

export default StudioInitializer;