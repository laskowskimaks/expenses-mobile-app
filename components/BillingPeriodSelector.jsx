import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Surface, IconButton, Text, useTheme } from 'react-native-paper';

const BillingPeriodSelector = ({
  periodText,
  onPrevious,
  onNext,
  onGoToStart,
  onGoToEnd,
  onPeriodTextPress,
  isPreviousDisabled,
  isNextDisabled,
  isGoToStartDisabled,
  isGoToEndDisabled,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <Surface style={styles.surface} elevation={2}>
      <IconButton
        icon="chevron-double-left"
        size={22}
        onPress={onGoToStart}
        disabled={isGoToStartDisabled}
        style={styles.iconButton}
      />
      <IconButton
        icon="chevron-left"
        size={22}
        onPress={onPrevious}
        disabled={isPreviousDisabled}
        style={styles.iconButton}
      />
      <Pressable onPress={onPeriodTextPress} style={styles.textContainer}>
        <Text variant="titleMedium" style={styles.periodText}>{periodText}</Text>
      </Pressable>
      <IconButton
        icon="chevron-right"
        size={22}
        onPress={onNext}
        disabled={isNextDisabled}
        style={styles.iconButton}
      />
      <IconButton
        icon="chevron-double-right"
        size={22}
        onPress={onGoToEnd}
        disabled={isGoToEndDisabled}
        style={styles.iconButton}
      />
    </Surface>
  );
};

const createStyles = (theme) => StyleSheet.create({
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: theme.colors.elevation.level2,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    marginHorizontal: 4,
  },
  periodText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  iconButton: {
    margin: 0,
  },
});

export default BillingPeriodSelector;