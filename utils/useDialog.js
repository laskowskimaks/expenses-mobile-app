import { useState } from 'react';

export const useDialog = () => {
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    content: '',
    confirmText: 'Potwierdź',
    cancelText: 'Anuluj',
    onConfirm: () => { },
    dangerous: false
  });

  const [infoDialog, setInfoDialog] = useState({
    visible: false,
    title: '',
    content: '',
    confirmText: 'OK',
    type: 'info'
  });

  const showDialog = ({ title, content, confirmText = 'Potwierdź', cancelText = 'Anuluj', onConfirm = () => { }, dangerous = false }) => {
    setDialog({
      visible: true,
      title,
      content,
      confirmText,
      cancelText,
      onConfirm,
      dangerous
    });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, visible: false }));
  };

  const showInfoDialog = ({ title, content, confirmText = 'OK', type = 'info' }) => {
    setInfoDialog({
      visible: true,
      title,
      content,
      confirmText,
      type
    });
  };

  const hideInfoDialog = () => {
    setInfoDialog(prev => ({ ...prev, visible: false }));
  };

  return {
    dialog,
    showDialog,
    hideDialog,
    infoDialog,
    showInfoDialog,
    hideInfoDialog
  };
};