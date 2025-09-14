import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import ContentLoader, { Rect } from 'react-content-loader/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32;

const SummaryCardSkeleton = () => {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <Card style={styles.card}>
            <Card.Content>
                <ContentLoader
                    speed={1.2}
                    width={CARD_WIDTH - 32}
                    height={100}
                    viewBox={`0 0 ${CARD_WIDTH - 32} 100`}
                    backgroundColor={theme.dark ? "#2a2a2a" : "#e9ecef"}
                    foregroundColor={theme.dark ? "#3a3a3a" : "#f8f9fa"}
                >
                    <Rect x="0" y="8" rx="3" ry="3" width="60" height="14" />
                    <Rect x="0" y="30" rx="4" ry="4" width="120" height="24" />

                    <Rect x={CARD_WIDTH - 152} y="8" rx="3" ry="3" width="60" height="14" />
                    <Rect x={CARD_WIDTH - 152} y="30" rx="4" ry="4" width="120" height="24" />

                    <Rect x="0" y="70" rx="4" ry="4" width={CARD_WIDTH - 32} height="8" />

                    <Rect x={(CARD_WIDTH - 32) / 2 - 12} y="85" rx="12" ry="12" width="24" height="12" />
                </ContentLoader>
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginVertical: 4,
        backgroundColor: theme.colors.elevation.level2,
    },
});

export default SummaryCardSkeleton;