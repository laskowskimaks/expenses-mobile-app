import React from 'react';
import { Portal, Dialog, Text, Button } from 'react-native-paper';

const ConfirmationDialog = ({
  visible,
  onDismiss,
  title,
  content,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  onConfirm,
  dangerous = false
}) => {
  const handleConfirm = () => {
    onConfirm();
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{content}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{cancelText}</Button>
          <Button
            onPress={handleConfirm}
            mode="contained"
            buttonColor={dangerous ? '#d32f2f' : undefined}
            textColor={dangerous ? '#ffffff' : undefined}
            style={{ marginLeft: 8 }}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmationDialog;
