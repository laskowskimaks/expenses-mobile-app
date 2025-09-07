import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

const DateSeparator = ({ title }) => {
  const theme = useTheme();
  const isDark = theme.dark;

  const gradientColors = isDark 
    ? [
        'rgba(45, 45, 45, 0.9)',   
        'rgba(45, 45, 45, 0.7)',   
        'rgba(45, 45, 45, 0.3)',   
      ]
    : [
        'rgba(248, 249, 250, 0.9)', 
        'rgba(248, 249, 250, 0.7)', 
        'rgba(248, 249, 250, 0.3)', 
      ];

  const lineColor = isDark 
    ? 'rgba(220, 220, 220, 0.4)' 
    : 'rgba(44, 62, 80, 0.3)';

  const textColor = isDark 
    ? '#e8e8e8' 
    : '#2c3e50';

  const borderColor = isDark 
    ? 'rgba(80, 80, 80, 0.3)' 
    : 'rgba(224, 224, 224, 0.2)';

  const textShadowColor = isDark 
    ? 'rgba(0, 0, 0, 0.8)' 
    : 'rgba(255, 255, 255, 0.8)';

  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.container, { borderBottomColor: borderColor }]}
    >
      <View style={styles.dateRow}>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
        <Text style={[
          styles.text, 
          { 
            color: textColor,
            textShadowColor: textShadowColor 
          }
        ]}>
          {title}
        </Text>
        <View style={[styles.line, { backgroundColor: lineColor }]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    marginHorizontal: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default DateSeparator;