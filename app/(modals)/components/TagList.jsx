import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { List, useTheme, Divider, Text } from 'react-native-paper';

const TagList = ({ tags, onSelectTag, onAddNew }) => {
    const theme = useTheme();

    const getUsageText = (count) => {
        if (count === 0) return null;
        if (count === 1) return "W 1 transakcji";
        if (count > 1 && count < 5) return `W ${count} transakcjach`;
        return `W ${count} transakcji`;
    };

    const renderItem = ({ item }) => (
        <List.Item
            title={item.name}
            titleStyle={{ color: theme.colors.onSurface }}
            description={getUsageText(item.transactionCount)}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            onPress={() => onSelectTag(item)}
            left={() => (
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            )}
        />
    );

    const ListHeader = () => (
        <>
            <List.Item
                title="Dodaj nowy tag"
                titleStyle={{ color: theme.colors.primary }}
                onPress={onAddNew}
                left={props => <List.Icon {...props} icon="plus-circle-outline" color={theme.colors.primary} />}
            />
            <Divider />
        </>
    );

    return (
        <FlatList
            data={tags}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <Divider />}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContent}
        />
    );
};

const styles = StyleSheet.create({
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        margin: 8,
        marginRight: 24,
    },
    listContent: {
        paddingHorizontal: 16,
    }
});

export default TagList;