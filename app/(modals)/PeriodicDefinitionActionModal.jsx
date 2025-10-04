import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function PeriodicDefinitionActionModal({ visible, onDismiss, onSelect, actionType, transaction }) {
  const theme = useTheme();

  const isEdit = actionType === 'edit';
  const title = isEdit ? 'Edytować serię?' : 'Usunąć serię?';
  const description = 'Wybierz, jak chcesz zmodyfikować tę serię transakcji cyklicznych:';
  const isInactive = transaction?.endDate && transaction.endDate < Date.now() / 1000;

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
            name={isEdit ? 'pencil-circle' : 'delete-circle'}
            size={42}
            color={isEdit ? theme.colors.primary : theme.colors.error}
          />
          <Text variant="headlineSmall" style={styles.title}>{title}</Text>
        </View>
        <Text variant="bodyMedium" style={styles.description}>{description}</Text>
        <View style={styles.buttonContainer}>
          {isEdit ? (
            <>
              <Button mode="contained" onPress={() => onSelect('all')} style={styles.button} icon="calendar-sync">
                Edytuj całą serię
              </Button>
              <Button mode="contained" onPress={() => onSelect('future')} style={styles.button} icon={isInactive ? "content-copy" : "calendar-arrow-right"}>
                {isInactive ? "Użyj jako szablonu" : "Zakończ i stwórz nową od teraz"}
              </Button>
            </>
          ) : (
            <>
              {!isInactive && (
                <Button mode="contained" onPress={() => onSelect('end')} style={styles.button} icon="calendar-remove">
                  Zakończ serię (zachowaj historię)
                </Button>
              )}
              <Button mode="contained" onPress={() => onSelect('delete_all')} style={styles.button} icon="calendar-remove-outline">
                Usuń serię i wszystkie jej transakcje
              </Button>
            </>
          )}
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
    alignItems: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    marginTop: 12,
    fontWeight: 'bold'
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  buttonContainer: {
    width: '100%'
  },
  button: {
    marginBottom: 12
  },
  cancelButton: {
    marginTop: 8
  },
});
