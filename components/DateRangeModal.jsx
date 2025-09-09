import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Modal, Card, Title, Button, Text, Divider, useTheme } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

const DateRangeModal = ({ isVisible, onDismiss, onConfirm, onClear, initialPeriod }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [startDate, setStartDate] = React.useState(initialPeriod?.startDate || new Date());
  const [endDate, setEndDate] = React.useState(initialPeriod?.endDate || new Date());
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerTarget, setPickerTarget] = React.useState('start');

  React.useEffect(() => {
    if (isVisible) {
      setStartDate(initialPeriod?.startDate || new Date());
      setEndDate(initialPeriod?.endDate || new Date());
    }
  }, [isVisible, initialPeriod]);

  const handleShowPicker = (target) => {
    setPickerTarget(target);
    setShowPicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');

    if (event.type === 'set' && selectedDate) {
      if (pickerTarget === 'start') {
        if (selectedDate > endDate) {
          setStartDate(selectedDate);
          setEndDate(selectedDate);
        } else {
          setStartDate(selectedDate);
        }
      } else {
        if (selectedDate < startDate) {
          setEndDate(selectedDate);
          setStartDate(selectedDate);
        } else {
          setEndDate(selectedDate);
        }
      }
    }
  };

  const handleConfirm = () => {
    onConfirm({ startDate, endDate });
  };

  const handleShowAll = () => {
    onConfirm(null);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Modal visible={isVisible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Wybierz zakres</Title>
          <Divider style={styles.divider} />
          <View style={styles.datePickersContainer}>
            <View style={styles.datePickerWrapper}>
              <Text style={styles.label}>Od</Text>
              <Pressable onPress={() => handleShowPicker('start')}>
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </Pressable>
            </View>
            <View style={styles.datePickerWrapper}>
              <Text style={styles.label}>Do</Text>
              <Pressable onPress={() => handleShowPicker('end')}>
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </Pressable>
            </View>
          </View>

          {showPicker && (
            <DateTimePicker
              value={pickerTarget === 'start' ? startDate : endDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <Button mode="outlined" onPress={handleShowAll} style={styles.showAllButton}>
            Pokaż wszystko
          </Button>

          <Divider style={styles.divider} />

          <View style={styles.actionsContainer}>
            <Button onPress={onClear}>Wyczyść</Button>
            <View style={styles.rightActions}>
              <Button onPress={onDismiss}>Anuluj</Button>
              <Button mode="contained" onPress={handleConfirm}>Zatwierdź</Button>
            </View>
          </View>
        </Card.Content>
      </Card>
    </Modal>
  );
};

const createStyles = (theme) => StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.elevation.level3,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 12,
  },
  datePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  datePickerWrapper: {
    alignItems: 'center',
  },
  label: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: 'bold',
    padding: 8,
  },
  showAllButton: {
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  rightActions: {
    flexDirection: 'row',
  }
});

export default DateRangeModal;