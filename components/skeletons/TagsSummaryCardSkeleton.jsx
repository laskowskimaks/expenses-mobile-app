import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import ContentLoader, { Rect } from 'react-content-loader/native';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth;

const TagsSummaryCardSkeleton = () => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const renderTagItemSkeleton = (yOffset) => (
        <React.Fragment key={yOffset}>
            <Rect x="16" y={yOffset + 8} rx="8" ry="8" width="16" height="16" />

            <Rect x="44" y={yOffset + 4} rx="3" ry="3" width="80" height="12" />

            <Rect x="44" y={yOffset + 20} rx="3" ry="3" width="60" height="10" />

            <Rect x={CARD_WIDTH - 60} y={yOffset + 8} rx="3" ry="3" width="40" height="12" />

            <Rect x="16" y={yOffset + 36} rx="2" ry="2" width={CARD_WIDTH - 32} height="4" />
        </React.Fragment>
    );

    return (
        <Card style={styles.card}>
            <Card.Content>
                <ContentLoader
                    speed={1.2}
                    width={CARD_WIDTH}
                    height={280}
                    viewBox={`0 0 ${CARD_WIDTH} 280`}
                    backgroundColor={theme.dark ? "#2a2a2a" : "#e9ecef"}
                    foregroundColor={theme.dark ? "#3a3a3a" : "#f8f9fa"}
                >
                    <Rect x="16" y="8" rx="4" ry="4" width="150" height="18" />

                    {renderTagItemSkeleton(40)}
                    {renderTagItemSkeleton(90)}
                    {renderTagItemSkeleton(140)}
                    {renderTagItemSkeleton(190)}
                    {renderTagItemSkeleton(240)}
                </ContentLoader>
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
});

export default TagsSummaryCardSkeleton;