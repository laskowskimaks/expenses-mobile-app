import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DbProvider, useDb } from '../context/DbContext';
import { Stack, SplashScreen, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isAuthLoading } = useAuth();
  const { initializeDatabase, clearDatabase, isLoading: isDbLoading } = useDb();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (isDbLoading) {
      return;
    }

    if (user) {
      console.log('[RootLayoutNav] Użytkownik i baza gotowi. Przekierowuję do /home...');
      router.replace('/(tabs)/home');
    } else {
      console.log('[RootLayoutNav] Użytkownik niezalogowany. Stan nawigacji jest poprawny.');
    }

  }, [user, isAuthLoading, isDbLoading, router]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (user) {
        console.log('[RootLayoutNav] Stan użytkownika: zalogowany. Inicjalizuję bazę...');
        initializeDatabase();
      } else {
        console.log('[RootLayoutNav] Stan użytkownika: wylogowany. Czyszczę bazę...');
        clearDatabase();
      }
    }
  }, [user, isAuthLoading, initializeDatabase, clearDatabase]);

  useEffect(() => {
    if (!isAuthLoading && !isDbLoading) {
      SplashScreen.hideAsync();
    }
  }, [isAuthLoading, isDbLoading]);

  if (isAuthLoading || isDbLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Stack />
  );
}

export default function RootLayout() {
  return (
    <DbProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </DbProvider>
  );
}