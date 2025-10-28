import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List, SegmentedButtons, useTheme, Divider, ActivityIndicator, TextInput, Button, HelperText, Portal, Modal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useNetworkStatus } from '@/context/NetworkContext';
import { useThemeContext } from '@/context/ThemeContext';
import { performUpload } from '@/services/backupService';
import { upsertSetting, getPaymentDay, getSavingsGoal } from '@/services/settingService';
import { insertTestData } from '@/utils/insertTestData';
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog';
import InformationDialog from '@/components/dialogs/InformationDialog';
import { useDialog } from '@/utils/useDialog';
import { eventEmitter } from '@/utils/eventEmitter';

export default function SettingsScreen() {
  const theme = useTheme();
  const { logout, user } = useAuth();
  const { db } = useDb();
  const { isConnected } = useNetworkStatus();
  const router = useRouter();
  const { themePreference, updateThemePreference } = useThemeContext();

  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);

  const [paymentDay, setPaymentDay] = useState('1');
  const [savingsGoal, setSavingsGoal] = useState(null);

  const [tempPaymentDay, setTempPaymentDay] = useState('1');
  const [tempSavingsGoal, setTempSavingsGoal] = useState('');

  const [errors, setErrors] = useState({});
  const { dialog, showDialog, hideDialog, infoDialog, showInfoDialog, hideInfoDialog } = useDialog();

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        if (db) {
          let fetchedDay = await getPaymentDay(db);
          if (!fetchedDay) {
            fetchedDay = '1';
            await upsertSetting(db, 'billing_period_start_day', '1');
          }
          setPaymentDay(fetchedDay);
          setTempPaymentDay(fetchedDay);

          const fetchedGoal = await getSavingsGoal(db);
          setSavingsGoal(fetchedGoal);
          setTempSavingsGoal(fetchedGoal || '');
        }
      };
      loadSettings();
    }, [db])
  );

  const handleAccordionPress = (id) => {
    const newExpandedId = expandedAccordion === id ? null : id;
    setExpandedAccordion(newExpandedId);
    setErrors({});

    if (newExpandedId === 'paymentDay') {
      setTempPaymentDay(paymentDay);
    }
    if (newExpandedId === 'savingsGoal') {
      const currentGoal = parseFloat(savingsGoal);
      setTempSavingsGoal(currentGoal > 0 ? savingsGoal : '');
    }
  };

  const handlePaymentDayInput = (text) => {
    const sanitized = text.replace(/[^0-9]/g, '').slice(0, 2);
    setTempPaymentDay(sanitized);
  };

  const handleSavingsGoalInput = (text) => {
    const sanitized = text.replace(/[^0-9.,]/g, '').replace(',', '.').slice(0, 10);
    setTempSavingsGoal(sanitized);
  };

  const handleSavePaymentDay = async () => {
    if (!db) {
      showInfoDialog({
        title: 'Błąd',
        content: 'Baza danych nie jest dostępna.',
        type: 'error'
      });
      return;
    }
    const day = parseInt(tempPaymentDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setErrors({ paymentDay: 'Wprowadź liczbę od 1 do 31.' });
      return;
    }
    try {
      await upsertSetting(db, 'billing_period_start_day', String(day));
      setPaymentDay(String(day));
      setErrors({});
      setExpandedAccordion(null);
    } catch (error) {
      console.error("[SettingsScreen] Błąd podczas zapisu dnia płatności:", error);
      showInfoDialog({
        title: 'Błąd',
        content: `Wystąpił błąd podczas zapisywania dnia płatności: ${error.message || error}`,
        type: 'error'
      });
    }
    eventEmitter.emit('settingsChanged', { key: 'payment_day' });
  };

  const handleSaveSavingsGoal = async () => {
    if (!db) {
      showInfoDialog({
        title: 'Błąd',
        content: 'Baza danych nie jest dostępna.',
        type: 'error'
      });
      return;
    }
    const goal = parseFloat(tempSavingsGoal.replace(',', '.') || '0');
    if (isNaN(goal) || goal < 0) {
      setErrors({ savingsGoal: 'Wprowadź poprawną, nieujemną kwotę.' });
      return;
    }
    try {
      await upsertSetting(db, 'savings_goal', String(goal));
      setSavingsGoal(String(goal));
      setErrors({});
      setExpandedAccordion(null);
    } catch (error) {
      console.error("[SettingsScreen] Błąd zapisu celu oszczędności:", error);
      showInfoDialog({
        title: 'Błąd',
        content: `Wystąpił błąd podczas zapisywania celu oszczędności: ${error.message || error}`,
        type: 'error'
      });
      return;
    }
    eventEmitter.emit('settingsChanged', { key: 'savings_goal' });
  };

  const handleRemoveSavingsGoal = async () => {
    if (!db) {
      showInfoDialog({
        title: 'Błąd',
        content: 'Baza danych nie jest dostępna.',
        type: 'error'
      });
      return;
    }
    try {
      await upsertSetting(db, 'savings_goal', '0');
      setSavingsGoal('0');
      setTempSavingsGoal('');
      setErrors({});
      setExpandedAccordion(null);
    } catch (error) {
      console.error("[SettingsScreen] Błąd usuwania celu oszczędności:", error);
      showInfoDialog({
        title: 'Błąd',
        content: `Wystąpił błąd podczas usuwania celu oszczędności: ${error.message || error}`,
        type: 'error'
      });
    }
    eventEmitter.emit('settingsChanged', { key: 'savings_goal' });
  };

  const handleChangeEmail = () => router.push('/(modals)/ChangeEmailModal');
  const handleChangePassword = () => router.push('/(modals)/ChangePasswordModal');
  const handleChangePin = () => router.push('/(modals)/ChangePinModal');
  const handleManageCategories = () => router.push('/(modals)/ManageCategoriesModal');
  const handleManageTags = () => router.push('/(modals)/ManageTagsModal');
  const handleManagePeriodic = () => router.push('/(modals)/ManagePeriodicTransactionsModal');

  const handlePerformBackup = async () => {
    if (isBackupLoading) return;
    setIsBackupLoading(true);

    try {
      await performUpload();
      showInfoDialog({
        title: 'Sukces',
        content: 'Kopia zapasowa została wykonana pomyślnie.',
        type: 'success'
      });
    } catch (error) {
      console.error("[SettingsScreen] Błąd backupu:", error);
      setIsBackupLoading(false);
      showInfoDialog({
        title: 'Błąd',
        content: `Wystąpił błąd: ${error.message || error}`,
        type: 'error'
      });
      return;
    } finally {
      setIsBackupLoading(false);
    }
  };

  const performLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      if (user && isConnected) {
        try {
          await Promise.race([
            performUpload(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Backup timeout')), 12000)
            )
          ]);

          await logout();
        } catch (backupError) {
          console.error('[Settings] Błąd backupu podczas wylogowania:', backupError);

          setIsLoggingOut(false);

          showDialog({
            title: 'Błąd synchronizacji',
            content: 'Nie udało się zsynchronizować najnowszych danych z chmurą. Mogą zostać utracone. Czy mimo to chcesz się wylogować?',
            confirmText: 'Wyloguj mimo to',
            cancelText: 'Anuluj',
            onConfirm: async () => {
              setIsLoggingOut(true);
              try {
                await logout();
              } catch (logoutError) {
                console.error('[Settings] Błąd wylogowania:', logoutError);
                showInfoDialog({
                  title: 'Błąd',
                  content: 'Wystąpił błąd podczas wylogowywania.',
                  type: 'error'
                });
              } finally {
                setIsLoggingOut(false);
              }
            },
            onCancel: () => {
              console.log('[Settings] Użytkownik anulował wylogowanie');
            },
            dangerous: true
          });
          return;
        }
      } else {
        await logout();
      }
    } catch (error) {
      console.error('[Settings] Błąd wylogowywania:', error);
      showInfoDialog({
        title: 'Błąd',
        content: 'Wystąpił błąd podczas wylogowywania.',
        type: 'error'
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (isConnected) {
      showDialog({
        title: 'Wylogowanie',
        content: 'Czy na pewno chcesz się wylogować? Twoje dane zostaną zsynchronizowane.',
        confirmText: 'Wyloguj',
        onConfirm: performLogout,
        dangerous: true
      });
    } else {
      showDialog({
        title: 'Brak połączenia z internetem',
        content: 'Nie można wykonać synchronizacji. Wszystkie zmiany wprowadzone od ostatniego backupu zostaną utracone. Czy na pewno chcesz kontynuować?',
        confirmText: 'Wyloguj mimo to',
        onConfirm: performLogout,
        dangerous: true
      });
    }
  };

  const handleAddTestData = async () => {
    if (!db) {
      showDialog({
        title: 'Błąd',
        content: 'Baza danych nie jest dostępna',
        confirmText: 'OK',
        onConfirm: () => { },
        dangerous: false
      });
      return;
    }
    try {
      const result = await insertTestData(db);
      if (result.success) {
        showDialog({
          title: 'Sukces',
          content: result.message,
          confirmText: 'OK',
          onConfirm: () => { },
          dangerous: false
        });
      } else {
        showDialog({
          title: 'Błąd',
          content: result.message,
          confirmText: 'OK',
          onConfirm: () => { },
          dangerous: false
        });
      }
    } catch (error) {
      showDialog({
        title: 'Błąd',
        content: 'Wystąpił błąd podczas dodawania testowych danych.',
        confirmText: 'OK',
        onConfirm: () => { },
        dangerous: false
      });
      console.error('[SettingsScreen] Błąd dodawania testowych danych:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        {/* TO DO - do usuniecia na koniec */}
        {__DEV__ && (
          <>
            <List.Section title="Developer Tools" titleStyle={styles.sectionTitle}>
              <List.Item
                title="Wstaw dane testowe"
                description="Dodaje przykładowe transakcje do bazy danych"
                left={props => <List.Icon {...props} icon="database-plus" />}
                onPress={handleAddTestData}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </List.Section>
          </>
        )}
        <List.Section title="Konto" titleStyle={styles.sectionTitle}>
          <List.Item
            title="Zmień email"
            description={!isConnected ? "Wymagane połączenie z internetem" : null}
            disabled={!isConnected}
            left={props => <List.Icon {...props} icon="email-outline" />}
            onPress={handleChangeEmail}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Zmień hasło"
            description={!isConnected ? "Wymagane połączenie z internetem" : null}
            disabled={!isConnected}
            left={props => <List.Icon {...props} icon="lock-outline" />}
            onPress={handleChangePassword}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Zmień/ustaw PIN"
            left={props => <List.Icon {...props} icon="shield-key-outline" />}
            onPress={handleChangePin}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />

          <List.Accordion
            title={`Dzień rozpoczęcia okresu: ${paymentDay}`}
            id="paymentDay"
            expanded={expandedAccordion === 'paymentDay'}
            onPress={() => handleAccordionPress('paymentDay')}
            left={props => <List.Icon {...props} icon="calendar-month-outline" />}
          >
            <View style={styles.accordionContent}>
              <TextInput
                mode="outlined"
                label="Dzień (1-31)"
                value={tempPaymentDay}
                onChangeText={handlePaymentDayInput}
                keyboardType="number-pad"
                maxLength={2}
                error={!!errors.paymentDay}
              />
              <HelperText type="error" visible={!!errors.paymentDay}>{errors.paymentDay}</HelperText>
              <View style={styles.buttonRow}>
                <Button mode="contained" onPress={handleSavePaymentDay}>Zapisz</Button>
              </View>
            </View>
          </List.Accordion>

          <Divider />

          <List.Accordion
            title={`Cel oszczędnościowy: ${savingsGoal && parseFloat(savingsGoal) > 0 ? `${savingsGoal} zł` : 'Nie ustawiono'}`}
            id="savingsGoal"
            expanded={expandedAccordion === 'savingsGoal'}
            onPress={() => handleAccordionPress('savingsGoal')}
            left={props => <List.Icon {...props} icon="bullseye-arrow" />}
          >
            <View style={styles.accordionContent}>
              <TextInput
                mode="outlined"
                label="Kwota celu"
                value={tempSavingsGoal}
                onChangeText={handleSavingsGoalInput}
                keyboardType="numeric"
                error={!!errors.savingsGoal}
              />
              <HelperText type="error" visible={!!errors.savingsGoal}>{errors.savingsGoal}</HelperText>
              <View style={styles.buttonRow}>
                {savingsGoal && parseFloat(savingsGoal) > 0 && (
                  <Button onPress={handleRemoveSavingsGoal}>Usuń</Button>
                )}
                <Button onPress={() => handleAccordionPress(null)}>Anuluj</Button>
                <Button mode="contained" onPress={handleSaveSavingsGoal}>Zapisz</Button>
              </View>
            </View>
          </List.Accordion>

        </List.Section>

        <List.Section title="Zarządzaj" titleStyle={styles.sectionTitle}>
          <List.Item
            title="Zarządzaj transakcjami cyklicznymi"
            left={props => <List.Icon {...props} icon="calendar-sync-outline" />}
            onPress={handleManagePeriodic}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Zarządzaj kategoriami"
            left={props => <List.Icon {...props} icon="shape-outline" />}
            onPress={handleManageCategories}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Zarządzaj tagami"
            left={props => <List.Icon {...props} icon="tag-multiple-outline" />}
            onPress={handleManageTags}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        </List.Section>
        <Divider />
        <List.Subheader>Motyw aplikacji</List.Subheader>
        <List.Section>
          <View style={styles.segmentedButtonContainer}>
            <SegmentedButtons
              value={themePreference}
              onValueChange={updateThemePreference}
              buttons={[
                { value: 'light', label: 'Jasny', icon: 'white-balance-sunny' },
                { value: 'dark', label: 'Ciemny', icon: 'weather-night' },
                { value: 'auto', label: 'Auto', icon: 'theme-light-dark' },
              ]}
            />
          </View>
          <Divider />
          <List.Item
            title="Wykonaj backup"
            description={!isConnected ? "Wymagane połączenie z internetem" : null}
            disabled={!isConnected || isBackupLoading}
            left={props => <List.Icon {...props} icon="cloud-upload-outline" />}
            onPress={handlePerformBackup}
            right={props =>
              isBackupLoading
                ? <ActivityIndicator style={{ marginRight: 14 }} />
                : <List.Icon {...props} icon="chevron-right" />
            }
          />
          <Divider />
          <List.Item
            title="Wyloguj"
            titleStyle={{ color: theme.colors.error }}
            left={props => <List.Icon {...props} color={theme.colors.error} icon="logout" />}
            onPress={handleLogout}
            disabled={isLoggingOut}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Modal
          visible={isLoggingOut}
          dismissable={false}
          contentContainerStyle={[styles.loadingModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              Wylogowywanie...
            </Text>
            <Text variant="bodyMedium" style={[styles.loadingSubtext, { color: theme.colors.onSurfaceVariant }]}>
              Synchronizacja danych z chmurą
            </Text>
          </View>
        </Modal>


        <Modal
          visible={isBackupLoading}
          dismissable={false}
          contentContainerStyle={[styles.loadingModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="titleMedium" style={[styles.loadingText, { color: theme.colors.onSurface }]}>
              Tworzenie kopii zapasowej...
            </Text>
            <Text variant="bodyMedium" style={[styles.loadingSubtext, { color: theme.colors.onSurfaceVariant }]}>
              Proszę czekać
            </Text>
          </View>
        </Modal>
      </Portal>

      <InformationDialog {...infoDialog} onDismiss={hideInfoDialog} />
      <ConfirmationDialog {...dialog} onDismiss={hideDialog} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 75,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  segmentedButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingModal: {
    margin: 20,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    textAlign: 'center',
  },
  loadingSubtext: {
    textAlign: 'center',
  },
});