import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme, Subheading } from 'react-native-paper';
import CategoryListItem from '../items/CategoryListItem';

const CategoryExpenseList = ({ data, total, isLoading, onCategoryPress }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Subheading style={styles.title}>Wydatki według kategorii</Subheading>
        <Text style={styles.noDataText}>Brak wydatków w wybranym okresie.</Text>
      </View>
    );
  }

  const sortedData = [...data].sort((a, b) => b.y - a.y);

  return (
    <View style={styles.container}>
      <Subheading style={styles.title}>Wydatki według kategorii</Subheading>
      {sortedData.map((item) => {
        const percentage = total > 0 ? (item.y / total) * 100 : 0;
        return (
          <CategoryListItem
            key={item.id}
            name={item.x}
            amount={item.y}
            color={item.color}
            iconName={item.iconName}
            percentage={percentage}
            transactionCount={item.transactionCount || 0}
            avgDailyExpense={item.avgDailyExpense || 0}
            onPress={() => onCategoryPress && onCategoryPress(item)}
          />
        );
      })}
    </View>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: theme.colors.onSurfaceVariant,
  },
});

export default CategoryExpenseList;