import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { List, SegmentedButtons, useTheme, Divider, ActivityIndicator, TextInput, Button, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDb } from '@/context/DbContext';
import { useNetworkStatus } from '@/context/NetworkContext';
import { useThemeContext } from '@/context/ThemeContext';
import { performUpload } from '@/services/backupService';
import { upsertSetting, getPaymentDay, getSavingsGoal } from '@/services/authService';

export default function SettingsScreen() {
  const theme = useTheme();
  const { logout } = useAuth();
  const { db } = useDb();
  const { isConnected } = useNetworkStatus();
  const router = useRouter();
  const { themePreference, updateThemePreference } = useThemeContext();

  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [expandedAccordion, setExpandedAccordion] = useState(null);
  
  const [paymentDay, setPaymentDay] = useState('1');
  const [savingsGoal, setSavingsGoal] = useState(null);

  const [tempPaymentDay, setTempPaymentDay] = useState('1');
  const [tempSavingsGoal, setTempSavingsGoal] = useState('');

  const [errors, setErrors] = useState({});

  useFocusEffect(
    useCallback(() => {
      const loadSettings = async () => {
        if (db) {
          // Logika dla dnia płatności z wartością domyślną
          let fetchedDay = await getPaymentDay(db);
          if (!fetchedDay) {
            fetchedDay = '1'; 
            await upsertSetting(db, 'billing_period_start_day', '1');
          }
          setPaymentDay(fetchedDay);
          setTempPaymentDay(fetchedDay);

          // Logika dla celu oszczędnościowego
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

  const handleSavePaymentDay = async () => {
    const day = parseInt(tempPaymentDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      setErrors({ paymentDay: 'Wprowadź liczbę od 1 do 31.' });
      return;
    }
    await upsertSetting(db, 'billing_period_start_day', String(day));
    setPaymentDay(String(day));
    setErrors({});
    setExpandedAccordion(null);
  };
  
  const handleSaveSavingsGoal = async () => {
    const goal = parseFloat(tempSavingsGoal.replace(',', '.') || '0');
    if (isNaN(goal) || goal < 0) {
      setErrors({ savingsGoal: 'Wprowadź poprawną, nieujemną kwotę.' });
      return;
    }
    await upsertSetting(db, 'savings_goal', String(goal));
    setSavingsGoal(String(goal));
    setErrors({});
    setExpandedAccordion(null);
  };

  const handleRemoveSavingsGoal = async () => {
    await upsertSetting(db, 'savings_goal', '0');
    setSavingsGoal('0');
    setTempSavingsGoal('');
    setErrors({});
    setExpandedAccordion(null);
  };

  const handleChangeEmail = () => router.push('/(modals)/ChangeEmailModal');
  const handleChangePassword = () => router.push('/(modals)/ChangePasswordModal');
  const handleChangePin = () => router.push('/(modals)/ChangePinModal');
  const handleManageCategories = () => router.push('/(modals)/ManageCategoriesModal');
  const handleManageTags = () => router.push('/(modals)/ManageTagsModal');
  const handleManagePeriodic = () => router.push('/(modals)/ManagePeriodicTransactionsModal');
  const handleManageNotifications = () => console.log('Zarządzaj powiadomieniami');

  const handlePerformBackup = async () => {
    if (isBackupLoading) return;
    setIsBackupLoading(true);
    try {
      await performUpload();
      Alert.alert('Sukces', 'Kopia zapasowa została wykonana pomyślnie.');
    } catch (error) {
      console.error("[SettingsScreen] Błąd backupu:", error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas tworzenia kopii zapasowej.');
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleLogout = () => {
    if (isConnected) {
      Alert.alert(
        'Wylogowanie',
        'Czy na pewno chcesz się wylogować? Twoje dane zostaną zsynchronizowane.',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Wyloguj', style: 'destructive', onPress: () => logout() }
        ]
      );
    } else {
      Alert.alert(
        'Brak połączenia z internetem',
        'Nie można wykonać synchronizacji. Wszystkie zmiany wprowadzone od ostatniego backupu mogą zostać utracone. Czy na pewno chcesz kontynuować?',
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Wyloguj mimo to', style: 'destructive', onPress: () => logout() }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
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
                    onChangeText={setTempPaymentDay}
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
                    onChangeText={setTempSavingsGoal}
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
          <Divider />
          <List.Item
            title="Zarządzaj transakcjami cyklicznymi"
            left={props => <List.Icon {...props} icon="calendar-sync-outline" />}
            onPress={handleManagePeriodic}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          <Divider />
          <List.Item
            title="Zarządzaj powiadomieniami"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            onPress={handleManageNotifications}
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
          />
        </List.Section>

      </ScrollView>
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
  }
});