import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function PeriodicActionChoiceModal({
  visible,
  onDismiss,
  onSelect,
  actionType,
}) {
  const theme = useTheme();

  const title = actionType === 'edit' ? 'Edytować transakcję' : 'Usunąć transakcję';
  const description = 'Ta transakcja jest częścią serii cyklicznej. Wybierz, jak chcesz ją zmodyfikować:';
  const optionOneText = actionType === 'edit' ? 'Edytuj tylko tę transakcję' : 'Usuń tylko tę transakcję';
  const optionTwoText = actionType === 'edit' ? 'Edytuj tę i wszystkie przyszłe' : 'Usuń tę i wszystkie przyszłe';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <MaterialCommunityIcons
            name={actionType === 'edit' ? 'pencil-circle' : 'delete-circle'}
            size={42}
            color={actionType === 'edit' ? theme.colors.primary : theme.colors.error}
          />
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.description}>
          {description}
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => onSelect('single')}
            style={styles.button}
            icon="numeric-1-box-outline"
          >
            {optionOneText}
          </Button>
          <Button
            mode="contained"
            onPress={() => onSelect('future')}
            style={styles.button}
            icon="calendar-sync"
          >
            {optionTwoText}
          </Button>
          <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
            Anuluj
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 24,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
});