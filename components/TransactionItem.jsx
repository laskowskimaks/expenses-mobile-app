import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency, formatDate } from '@/services/transactionService';

const TransactionItem = ({ transaction }) => {
  const isExpense = transaction.amount < 0;
  const isPeriodicTransaction = transaction.type === 'periodic';

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {/* Ikona kategorii */}
        <View style={[styles.iconContainer, { backgroundColor: transaction.categoryColor || '#gray' }]}>
          <MaterialCommunityIcons 
            name={transaction.categoryIcon || 'help-circle'} 
            size={24} 
            color="white" 
          />
        </View>
        
        {/* Informacje o transakcji */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{transaction.title}</Text>
            {isPeriodicTransaction && (
              <View style={styles.periodicBadge}>
                <Text style={styles.periodicText}>Cykliczna</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.category}>{transaction.categoryName || 'Bez kategorii'}</Text>
          <Text style={styles.date}>{formatDate(transaction.transactionDate)}</Text>
          
          {transaction.location && (
            <Text style={styles.location}>📍 {transaction.location}</Text>
          )}
          
          {transaction.notes && (
            <Text style={styles.notes}>{transaction.notes}</Text>
          )}
          
          {isPeriodicTransaction && (
            <Text style={styles.repeatInfo}>
              Co {transaction.repeatInterval} {getRepeatUnitText(transaction.repeatUnit)}
            </Text>
          )}
        </View>
      </View>
      
      {/* Kwota */}
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount,
          { color: isExpense ? '#e74c3c' : '#27ae60' }
        ]}>
          {isExpense ? '' : '+'}{formatCurrency(transaction.amount)}
        </Text>
      </View>
    </View>
  );
};

const getRepeatUnitText = (unit) => {
  switch (unit) {
    case 'day': return 'dni';
    case 'week': return 'tygodni';
    case 'month': return 'miesiące';
    case 'year': return 'lat';
    default: return unit;
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 4,
    marginHorizontal: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  periodicBadge: {
    backgroundColor: '#3498db',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  periodicText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  repeatInfo: {
    fontSize: 11,
    color: '#3498db',
    fontWeight: '600',
  },
  amountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionItem;