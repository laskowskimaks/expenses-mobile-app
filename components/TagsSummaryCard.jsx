import React from 'react';
import { StyleSheet } from 'react-native';
import { useTheme, Card, Title, Text } from 'react-native-paper';
import TagSummaryItem from './TagSummaryItem';
import TagsSummaryCardSkeleton from '@/components/skeletons/TagsSummaryCardSkeleton';

const TagsSummaryCard = ({ data, totalExpenses, isLoading, onTagPress }) => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const renderContent = () => {
        if (isLoading) {
            return <TagsSummaryCardSkeleton />;
        }

        if (!data || data.length === 0) {
            return <Text style={styles.noDataText}>Brak otagowanych wydatków w tym okresie</Text>;
        }

        return data.map((item) => (
            <TagSummaryItem
                key={item.id}
                item={item}
                totalExpenses={totalExpenses}
                onPress={onTagPress}
            />
        ));
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Title style={styles.title}>Podsumowanie Tagów</Title>
                {renderContent()}
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme) => StyleSheet.create({
    card: {
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: theme.colors.surface,
        paddingBottom: 75,
    },
    title: {
        marginBottom: 12,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.onSurface,
    },
    loadingContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        textAlign: 'center',
        paddingVertical: 20,
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
    },
});

export default TagsSummaryCard;