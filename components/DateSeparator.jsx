import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const DateSeparator = ({ title }) => {
  return (
    <LinearGradient
      colors={[
        'rgba(248, 249, 250, 0.9)', //  Góra
        'rgba(248, 249, 250, 0.7)', //  Środek
        'rgba(248, 249, 250, 0.3)', //  Dół
      ]}
      style={styles.container}
    >
      <View style={styles.dateRow}>
        <View style={styles.line} />
        <Text style={styles.text}>{title}</Text>
        <View style={styles.line} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(224, 224, 224, 0.2)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.3)',
    marginHorizontal: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    paddingHorizontal: 12,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default DateSeparator;