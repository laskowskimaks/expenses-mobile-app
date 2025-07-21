import React, { createContext, useState, useContext, useCallback, useRef, useMemo, useEffect } from 'react';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as schema from '@/database/schema';
import { checkAndRestoreBackup, performUpload } from '@/services/backupService';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '@/drizzle/migrations';
import { createUser } from '@/services/authService';
import { openDatabaseSync } from 'expo-sqlite';
import StudioInitializer from '@/database/StudioInitializer';

export const DATABASE_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

export const DbContext = createContext();

export const DbProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const sqliteConnectionRef = useRef(null);
    const isClearingRef = useRef(false);



    const clearDatabase = useCallback(async () => {
        if (!db) {
            console.log('[DbContext] Brak instancji DB do wyczyszczenia, operacja pominięta.');
            return;
        }

        if (isClearingRef.current) {
            console.log('[DbContext] clearDatabase już trwa, pomijam.');
            return;
        }
        isClearingRef.current = true;
        setIsLoading(true);

        try {
            if (sqliteConnectionRef.current) {
                console.log('[DbContext] Zamykanie istniejącego połączenia z bazą...');
                try {
                    sqliteConnectionRef.current.closeSync();
                    console.log('[DbContext] Połączenie z bazą zostało zamknięte.');
                } catch (e) {
                    console.error('[DbContext] Błąd podczas zamykania połączenia (lub było już zamknięte):', e.message);
                }
            } else {
                console.log('[DbContext] Brak aktywnego połączenia do zamknięcia, kontynuuję.');
            }

            setDb(null);
            sqliteConnectionRef.current = null;

            await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
            console.log('[DbContext] Lokalny plik bazy danych usunięty.');

        } catch (e) {
            console.error('[DbContext] Błąd podczas czyszczenia bazy:', e);
        } finally {
            setIsLoading(false);
            isClearingRef.current = false;
        }
    }, [db]);

    const isInitializingRef = useRef(false);

    const initializeDatabase = useCallback(async (uid, skipRestore = false) => {
        if (isInitializingRef.current) {
            console.log('[DbContext] initializeDatabase już trwa, pomijam.');
            return;
        }
        isInitializingRef.current = true;

        setIsLoading(true);
        console.log('[DbContext] Inicjalizacja bazy danych po logowaniu...');

        if (sqliteConnectionRef.current) {
            try {
                sqliteConnectionRef.current.closeSync();
            } catch (e) {
                console.log("[DbContext] Nie udało się zamknąć starego połączenia:", e);
            }
        }
        setDb(null);
        sqliteConnectionRef.current = null;

        try {
            if (!skipRestore) {
                console.log('[DbContext] Sprawdzanie i przywracanie kopii zapasowej bazy danych...');
                await checkAndRestoreBackup(uid);
            }

            const { newSqliteConn, newDrizzleDb } = await _openAndMigrateDb();

            sqliteConnectionRef.current = newSqliteConn;
            setDb(newDrizzleDb);
            console.log('[DbContext] Nowe połączenie z bazą danych zostało utworzone.');



        } catch (e) {
            console.error('[DbContext] Krytyczny błąd podczas inicjalizacji bazy:', e);
            await clearDatabase();
        }
        setIsLoading(false);
        isInitializingRef.current = false;
    }, [clearDatabase]);

    const handleNewRegistration = useCallback(async (userId, email, password) => {
        setIsLoading(true);
        console.log(`[DbContext] Inicjalizacja bazy dla nowego użytkownika: ${email}`);

        await clearDatabase();

        try {
            const { newDrizzleDb, newSqliteConn } = await _openAndMigrateDb();

            const created = await createUser(newDrizzleDb, userId, email, password);
            if (!created) {
                throw new Error("Nie udało się dodać użytkownika do lokalnej bazy danych.");
            }
            console.log(`[DbContext] Użytkownik ${email} dodany pomyślnie.`);

            sqliteConnectionRef.current = newSqliteConn;
            setDb(newDrizzleDb);
            console.log('[DbContext] Nowa, pusta baza danych utworzona i uzupełniona.');

            await performUpload();

        } catch (e) {
            console.error('[DbContext] Krytyczny błąd podczas tworzenia nowej bazy:', e);
            setDb(null);
            sqliteConnectionRef.current = null;
        } finally {
            setIsLoading(false);
        }

    }, [clearDatabase]);


    const _openAndMigrateDb = async () => {
        console.log('[DbContext-Helper] Otwieranie połączenia i uruchamianie migracji...');
        try {
            const newSqliteConn = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
            const newDrizzleDb = drizzle(newSqliteConn, { schema });

            console.log('[DbContext-Helper] Uruchamianie migracji...');
            await migrate(newDrizzleDb, migrations);
            console.log('[DbContext-Helper] Migracje zakończone sukcesem.');

            return { newSqliteConn, newDrizzleDb };
        } catch (e) {
            console.error('[DbContext-Helper] Błąd podczas otwierania/migracji bazy:', e);
            throw e;
        }
    };

    const value = useMemo(() => ({
        db,
        isLoading,
        initializeDatabase,
        clearDatabase,
        handleNewRegistration
    }), [db, isLoading, initializeDatabase, clearDatabase, handleNewRegistration]);

    return <DbContext.Provider value={value}>
        {/* Uruchom Drizzle Studio tylko w DEV i gdy połączenie istnieje */}
        {__DEV__ && sqliteConnectionRef.current && (
            <StudioInitializer sqliteConn={sqliteConnectionRef.current} />
        )}
        {children}
    </DbContext.Provider>;
};

export const useDb = () => useContext(DbContext);