import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const { width: screenWidth } = Dimensions.get('window');

const CategoryDonutChartSkeleton = ({ compact = false }) => {
    const theme = useTheme();
    const styles = createStyles(theme, compact);

    const chartSize = compact ? screenWidth * 0.58 : screenWidth * 0.65;
    const containerHeight = compact ? screenWidth * 0.45 : screenWidth * 0.7;
    const centerX = chartSize / 2;
    const centerY = containerHeight / 2;
    const outerRadius = chartSize / 2 - 10;
    const innerRadius = compact ? chartSize * 0.4 : chartSize * 0.43;

    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.container}>
                    <ContentLoader
                        speed={1.2}
                        width={chartSize}
                        height={containerHeight}
                        viewBox={`0 0 ${chartSize} ${containerHeight}`}
                        backgroundColor={theme.dark ? "#2a2a2a" : "#e9ecef"}
                        foregroundColor={theme.dark ? "#3a3a3a" : "#f8f9fa"}
                    >
                        <Circle cx={centerX} cy={centerY} r={outerRadius} />
                        
                        <Circle 
                            cx={centerX} 
                            cy={centerY} 
                            r={innerRadius} 
                            fill={theme.colors.surface}
                        />

                        <Rect 
                            x={centerX - 40} 
                            y={centerY - 12} 
                            rx="4" 
                            ry="4" 
                            width="80" 
                            height={compact ? "16" : "20"} 
                        />
                        
                        <Rect 
                            x={centerX - 25} 
                            y={centerY + 12} 
                            rx="3" 
                            ry="3" 
                            width="50" 
                            height={compact ? "10" : "12"} 
                        />
                    </ContentLoader>
                </View>
            </Card.Content>
        </Card>
    );
};

const createStyles = (theme, compact) => StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: compact ? 4 : 16,
        marginTop: 4,
        backgroundColor: theme.colors.elevation.level1,
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        height: compact ? screenWidth * 0.45 : screenWidth * 0.7,
    },
});

export default CategoryDonutChartSkeleton;