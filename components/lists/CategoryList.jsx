import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { List, Icon, useTheme, Divider, Text } from 'react-native-paper';

const CategoryList = ({ categories, onSelectCategory, onAddNew }) => {
    const theme = useTheme();

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            titleStyle={{ color: theme.colors.onSurface }}
            onPress={() => onSelectCategory(item)}
            left={() => (
                <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                    <Icon source={item.iconName} size={24} color="#fff" />
                </View>
            )}
            right={() => (
                !item.isDeletable && <Icon source="lock-outline" size={24} color={theme.colors.onSurfaceDisabled} />
            )}
        />
    );

    const ListHeader = () => (
        <>
            <List.Item
                title="Dodaj nową kategorię"
                titleStyle={{ color: theme.colors.primary }}
                onPress={onAddNew}
                left={() => (
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <Icon source="plus-circle-outline" size={24} color={theme.colors.primary} />
                    </View>
                )}
            />
            <Divider />
        </>
    );
    const ListEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 32 }}>
                Brak kategorii do wyświetlenia.
            </Text>
        </View>
    );

    return (
        <FlatList
            data={categories}
            keyExtractor={(item) => (item.id !== undefined && item.id !== null ? item.id.toString() : Math.random().toString())}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <Divider />}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 120,
    },
});

export default CategoryList;