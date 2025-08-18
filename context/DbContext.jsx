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
import { initializeNewUserDatabase } from '@/database/defaultData';
import { processPeriodicTransactions } from '@/services/periodicTransactionService';
import { shouldCheckPeriodicTransactions, markPeriodicCheckCompleted } from '@/utils/periodicChecker';
import { Alert } from 'react-native';

export const DATABASE_NAME = 'database.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DATABASE_NAME}`;

export const DbContext = createContext();

export const DbProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const sqliteConnectionRef = useRef(null);
    const isClearingRef = useRef(false);
    const isInitializingRef = useRef(false);

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
                try {
                    console.log('[DbContext] Zamykanie istniejącego połączenia z bazą...');

                    if (typeof sqliteConnectionRef.current.closeSync === 'function') {
                        sqliteConnectionRef.current.closeSync();
                        console.log('[DbContext] Połączenie z bazą zostało zamknięte pomyślnie.');
                    } else {
                        console.log('[DbContext] Połączenie już nieaktywne.');
                    }

                } catch (closeError) {
                    console.log('[DbContext] Połączenie było już zamknięte lub wystąpił błąd podczas zamykania (to może być normalne)');
                }
            } else {
                console.log('[DbContext] Brak aktywnego połączenia do zamknięcia.');
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

            try {
                console.log('[DbContext] Sprawdzanie czy należy przetworzyć transakcje okresowe...');

                const shouldCheck = await shouldCheckPeriodicTransactions();

                if (shouldCheck) {
                    console.log('[DbContext] Wykonuję sprawdzenie transakcji okresowych...');
                    const periodicResult = await processPeriodicTransactions(newDrizzleDb);

                    if (periodicResult.success) {
                        // Oznaczenie sprawdzenia jako wykonane
                        await markPeriodicCheckCompleted();

                        if (periodicResult.addedCount > 0) {
                            console.log(`[DbContext] ${periodicResult.message}`);
                            console.log(`[DbContext] Dodane transakcje:`, periodicResult.addedTransactions.map(t => t.title));
                            if (__DEV__) {
                                Alert.alert('Dodano nowe transakcje', periodicResult.message);
                            }
                        } else {
                            console.log('[DbContext] Sprawdzenie transakcji okresowych zakończone - brak nowych transakcji');
                        }
                    } else {
                        console.error('[DbContext] Błąd podczas przetwarzania transakcji okresowych:', periodicResult.message);
                    }
                } else {
                    console.log('[DbContext] Transakcje okresowe sprawdzane niedawno, pomijam sprawdzenie');
                }

            } catch (periodicError) {
                console.error('[DbContext] Błąd podczas sprawdzania transakcji okresowych:', periodicError);
            }

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
            const { success, data: userData, error } = await createUser(userId, email, password);

            if (!success) {
                throw error || new Error("Nie udało się przygotować danych uwierzytelniających.");
            }

            await initializeNewUserDatabase(
                newDrizzleDb,
                userData.userId,
                userData.email,
                userData.hashedPassword,
                userData.passwordSalt
            );

            console.log(`[DbContext] Baza dla użytkownika ${email} zainicjalizowana pomyślnie.`);

            sqliteConnectionRef.current = newSqliteConn;
            setDb(newDrizzleDb);

            console.log('[DbContext] Nowa, baza danych utworzona i uzupełniona.');

            await performUpload();

        } catch (e) {
            if (e && e.message && e.message.includes('UNIQUE constraint failed')) {
                console.log('[DbContext] email już zarejestrowany:', email);
                alert('Nazwa użytkownika już zajęta');
            } else {
                alert('Wystąpił krytyczny błąd podczas rejestracji. Spróbuj ponownie.');
            }

            setDb(null);
            sqliteConnectionRef.current = null;

        } finally {
            setIsLoading(false);
        }

    }, [clearDatabase]);

    const _openAndMigrateDb = async () => {
        console.log('[DbContext-Helper] Otwieranie połączenia i uruchamianie migracji...');
        try {
            const newSqliteConn = openDatabaseSync(DATABASE_NAME, {
                enableChangeListener: true,
                readOnly: false,
                create: true,
            });
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