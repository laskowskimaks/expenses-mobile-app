import React from 'react';
import { Portal, Dialog, Text, Button } from 'react-native-paper';

const InformationDialog = ({
  visible,
  onDismiss,
  title,
  content,
  confirmText = 'OK',
  type = 'info' // 'info', 'success', 'error', 'warning'
}) => {
  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      default:
        return undefined;
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{content}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onPress={onDismiss}
            mode="contained"
            buttonColor={getButtonColor()}
            textColor={type !== 'info' ? '#ffffff' : undefined}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default InformationDialog;