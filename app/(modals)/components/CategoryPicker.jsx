import React, { useMemo, useCallback, memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import BottomSheet, { BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

const CategoryItem = memo(({ item, selectedCategory, onSelect }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={styles.categoryPickerItem}
      onPress={() => onSelect(item)}
      accessibilityRole="button"
      accessible
      accessibilityLabel={`Wybierz kategorię ${item.name}`}
    >
      <View style={[
        styles.categoryIcon,
        { backgroundColor: item.color || theme.colors.onSurface }
      ]}>
        <MaterialCommunityIcons
          name={item.iconName || 'help-circle'}
          size={24}
          color="white"
        />
      </View>

      <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
        {item.name}
      </Text>

      {selectedCategory?.id === item.id && (
        <MaterialCommunityIcons
          name="check-circle"
          size={24}
          color={theme.colors.primary}
        />
      )}
    </TouchableOpacity>
  );
});

const CategoryPicker = ({
  bottomSheetRef,
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading
}) => {
  const theme = useTheme();

  const snapPoints = useMemo(() => ['25%', '75%'], []);

  const handleCategorySelect = useCallback((category) => {
    onSelectCategory(category);
    bottomSheetRef.current?.close();
  }, [onSelectCategory, bottomSheetRef]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={theme.dark ? 0.8 : 0.5}
        enableTouchThrough={false}
        pressBehavior="close"
      />
    ),
    [theme.dark]
  );

  const renderCategoryItem = useCallback(({ item }) => (
    <CategoryItem
      item={item}
      selectedCategory={selectedCategory}
      onSelect={handleCategorySelect}
    />
  ), [selectedCategory, handleCategorySelect]);

  const keyExtractor = useCallback((item) => `category-${item.id}`, []);

  const getItemLayout = useCallback((data, index) => ({
    length: 64,
    offset: 64 * index,
    index,
  }), []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: theme.colors.background }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
      backdropComponent={renderBackdrop}
      style={{ flex: 1 }}
    >
      <Text style={[styles.bottomSheetTitle, { color: theme.colors.onBackground }]}>Wybierz Kategorię</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      ) : (
        <BottomSheetFlatList
          data={categories}
          keyExtractor={keyExtractor}
          renderItem={renderCategoryItem}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={true}
          style={styles.flatListStyle}
          contentContainerStyle={styles.flatListContent}
          accessibilityRole="list"
        />
      )}
    </BottomSheet>
  );
};

export default memo(CategoryPicker);

const styles = StyleSheet.create({
  bottomSheetContent: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  bottomSheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  flatListStyle: { flex: 1 },
  flatListContent: { flexGrow: 1, paddingBottom: 40 },
  categoryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    minHeight: 64,
  },
  categoryIcon: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '500' },
});
