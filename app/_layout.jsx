import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { runMigrations } from '../database/migrations';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName='testDB.db' onInit={runMigrations}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: true }} />
      </AuthProvider>
    </SQLiteProvider>
  );
}
