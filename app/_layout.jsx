import React, { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DbProvider, useDb } from '../context/DbContext';
import { Stack, SplashScreen, useRouter, usePathname } from 'expo-router';
import { ActivityIndicator, View, AppState, Text, StyleSheet } from 'react-native';
import { NetworkProvider, useNetworkStatus } from '@/context/NetworkContext';
import { getUserByemail } from '@/services/authService';

SplashScreen.preventAutoHideAsync();

const OfflineBanner = () => (
  <View style={styles.bannerContainer}>
    <Text style={styles.bannerText}>Brak połączenia z internetem</Text>
  </View>
);

function RootLayoutNav() {
  const { user, isAuthLoading, isLocked, lockApp, unlockApp, needsPinSetup, completeRegistration } = useAuth();
  const { isConnected } = useNetworkStatus();
  const { db, initializeDatabase, clearDatabase, isLoading: isDbLoading } = useDb();

  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const shouldShowBanner = !isConnected && !user;


  // Nasłuchiwanie stanu aplikacji w celu blokady
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && (nextAppState === 'inactive' || nextAppState === 'background')) {
        lockApp();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [lockApp]);

  useEffect(() => {
    const handleStateChange = async () => {
      // Jeśli autentykacja jeszcze trwa to skip
      if (isAuthLoading) {
        return;
      }

      // Jeśli użytkownik jest wylogowany
      if (!user) {
        if (db && !isDbLoading) {
          clearDatabase();
          return;
        }

        const protectedRoutes = ['/pinSetting', '/pinChecking'];
        const isInsideTabs = pathname.startsWith('/(tabs)');
        if (isInsideTabs || protectedRoutes.includes(pathname)) {
          router.replace('/');
        }
        await SplashScreen.hideAsync();
        return;
      }

      // Jeśli trwa proces rejestracji (ustawianie PINu)
      if (needsPinSetup) {
        if (pathname !== '/pinSetting') {
          router.replace({ pathname: '/pinSetting', params: { email: user.email } });
        }
        await SplashScreen.hideAsync();
        return;
      }

      // Jeśli nie ma bazy danych i nie trwa jej ładowanie
      if (!db) {
        if (!isDbLoading) {
          initializeDatabase(user.uid);
        }
        return;
      }

      // Jeśli aplikacja jest zablokowana PINem
      if (isLocked) {
        const dbUser = await getUserByemail(db, user.email);
        if (dbUser?.pin) {
          if (pathname !== '/pinChecking') {
            router.push('/pinChecking');
          }
        } else {
          unlockApp();
        }
        await SplashScreen.hideAsync();
        return;
      }

      // Użytkownik zalogowany, odblokowany, z gotową bazą.
      // Powinien być w aplikacji - przekierowanie do głównej strony.
      const pagesToRedirectFrom = ['/', '/login', '/register', '/pinSetting'];
      if (pagesToRedirectFrom.includes(pathname)) {
        router.replace('/(tabs)/home');
      }

      await SplashScreen.hideAsync();
    };

    handleStateChange();

  }, [user, isAuthLoading, isDbLoading, db, needsPinSetup, isLocked, pathname]);

  if (isAuthLoading || isDbLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Logowanie' }} />
        <Stack.Screen name="register" options={{ title: 'Rejestracja' }} />
        <Stack.Screen name="forgotPassword" options={{ title: 'Resetowanie Hasła' }} />
        <Stack.Screen name="pinSetting" options={{ title: 'Ustaw PIN' }} />
        <Stack.Screen
          name="pinChecking"
          options={{ title: 'Weryfikacja PIN', headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      {shouldShowBanner && <OfflineBanner />}
    </>
  );
}


export default function RootLayout() {
  return (
    <NetworkProvider>
      <DbProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </DbProvider>
    </NetworkProvider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#c23616',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  bannerText: {
    color: 'white',
    fontWeight: 'bold',
  },
});