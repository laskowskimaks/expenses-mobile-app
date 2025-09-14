import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32;

const KeyIndicatorsCardSkeleton = () => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const columnWidth = (CARD_WIDTH - 32) / 3;
    const centerOffset1 = columnWidth / 2;
    const centerOffset2 = columnWidth + (columnWidth / 2);
    const centerOffset3 = (columnWidth * 2) + (columnWidth / 2);

    return (
        <Card style={styles.card}>
            <Card.Content>
                <ContentLoader
                    speed={1.2}
                    width={CARD_WIDTH - 32}
                    height={130}
                    viewBox={`0 0 ${CARD_WIDTH - 32} 130`}
                    backgroundColor={theme.dark ? "#2a2a2a" : "#e9ecef"}
                    foregroundColor={theme.dark ? "#3a3a3a" : "#f8f9fa"}
                >
                    <Circle cx={centerOffset1} cy="28" r="20" />
                    <Rect x={centerOffset1 - 30} y="56" rx="3" ry="3" width="60" height="12" />
                    <Rect x={centerOffset1 - 25} y="74" rx="3" ry="3" width="50" height="10" />
                    <Rect x={centerOffset1 - 20} y="92" rx="4" ry="4" width="40" height="16" />

                    <Rect x={columnWidth - 1} y="20" rx="0.5" ry="0.5" width="1" height="90" />

                    <Circle cx={centerOffset2} cy="28" r="20" />
                    <Rect x={centerOffset2 - 30} y="56" rx="3" ry="3" width="60" height="12" />
                    <Rect x={centerOffset2 - 35} y="74" rx="3" ry="3" width="70" height="10" />
                    <Rect x={centerOffset2 - 25} y="92" rx="4" ry="4" width="50" height="16" />

                    <Rect x={(columnWidth * 2) - 1} y="20" rx="0.5" ry="0.5" width="1" height="90" />

                    <Circle cx={centerOffset3} cy="28" r="20" />
                    <Rect x={centerOffset3 - 30} y="56" rx="3" ry="3" width="60" height="12" />
                    <Rect x={centerOffset3 - 25} y="74" rx="3" ry="3" width="50" height="10" />
                    <Rect x={centerOffset3 - 20} y="92" rx="4" ry="4" width="40" height="16" />
                </ContentLoader>
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: theme.colors.elevation.level1,
    },
});

export default KeyIndicatorsCardSkeleton;