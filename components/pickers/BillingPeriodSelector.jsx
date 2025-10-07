import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
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
        size={18}
        onPress={onGoToStart}
        disabled={isGoToStartDisabled}
        style={styles.iconButton}
      />
      <IconButton
        icon="chevron-left"
        size={18}
        onPress={onPrevious}
        disabled={isPreviousDisabled}
        style={styles.iconButton}
      />
      <Pressable onPress={onPeriodTextPress} style={styles.textContainer}>
        <Text variant="titleSmall" style={styles.periodText}>{periodText}</Text>
      </Pressable>
      <IconButton
        icon="chevron-right"
        size={18}
        onPress={onNext}
        disabled={isNextDisabled}
        style={styles.iconButton}
      />
      <IconButton
        icon="chevron-double-right"
        size={18}
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
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 20,
    marginHorizontal: 20,
    backgroundColor: theme.colors.elevation.level2,
    minHeight: 40,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    marginHorizontal: 2,
  },
  periodText: {
    color: theme.colors.onSurface,
    textAlign: 'center',
    fontSize: 14,
  },
  iconButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
});

export default BillingPeriodSelector;