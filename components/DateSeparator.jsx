import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DateSeparator = ({ title }) => (
  <View style={styles.container}>
    <View style={styles.line} />
    <Text style={styles.text}>{title}</Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ced4da',
  },
  text: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
});

export default DateSeparator;