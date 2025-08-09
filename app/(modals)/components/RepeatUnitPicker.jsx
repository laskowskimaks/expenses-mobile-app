import React from 'react';
import { View, FlatList, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function RepeatUnitPicker({
  visible,
  onClose,
  repeatUnits,
  onSelectUnit,
  selectedUnit
}) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.absoluteOverlay}>
      <Pressable style={styles.pickerBackdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Zamknij wybór jednostki" />
      <View style={[styles.pickerContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.pickerTitle, { color: theme.colors.onBackground }]}>Wybierz jednostkę czasu</Text>
        <FlatList
          data={repeatUnits}
          keyExtractor={item => item.value}
          renderItem={({ item }) => {
            const isSelected = selectedUnit === item.value;
            return (
              <TouchableOpacity
                style={[styles.pickerItem, isSelected && { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => onSelectUnit(item.value)}
                accessibilityRole="button"
                accessible
                accessibilityLabel={`${item.label} ${isSelected ? '(zaznaczone)' : ''}`}
              >
                <Text variant="bodyLarge" style={[styles.itemText, { color: isSelected ? theme.colors.primary : theme.colors.onSurface }]}>
                  {item.label}
                </Text>
                {isSelected && <Text style={[styles.checkIcon, { color: theme.colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            );
          }}
          accessibilityRole="list"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, elevation: 1000 },
  pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, width: '100%', minHeight: 200 },
  pickerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc', borderRadius: 8, marginBottom: 4 },
  itemText: { flex: 1 },
  checkIcon: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
});
