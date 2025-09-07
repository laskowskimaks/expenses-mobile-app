import React from 'react';
import { StyleSheet } from 'react-native';
import { Searchbar as PaperSearchbar } from 'react-native-paper';

const SearchBar = ({ value, onChangeText, placeholder = "Szukaj..." }) => {
  return (
    <PaperSearchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={styles.searchbar}
      elevation={1}
    />
  );
};

const styles = StyleSheet.create({
  searchbar: {
    margin: 16,
    borderRadius: 12,
  },
});

export default SearchBar;