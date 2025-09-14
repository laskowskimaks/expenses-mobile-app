import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import CategoryDonutChartSkeleton from './CategoryDonutChartSkeleton';
import SummaryCardSkeleton from './SummaryCardSkeleton';
import KeyIndicatorsCardSkeleton from './KeyIndicatorsCardSkeleton';
import TagsSummaryCardSkeleton from './TagsSummaryCardSkeleton';
import ContentLoader, { Rect } from 'react-content-loader/native';

const BillingPeriodSelectorSkeleton = () => {
    const theme = useTheme();

    return (
        <View style={{
            backgroundColor: theme.colors.background,
            paddingTop: 8,
            paddingBottom: 4,
            paddingHorizontal: 16,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            zIndex: 10,
        }}>
            <ContentLoader
                speed={1.2}
                width="100%"
                height={50}
                viewBox="0 0 350 50"
                backgroundColor={theme.dark ? "#2a2a2a" : "#e9ecef"}
                foregroundColor={theme.dark ? "#3a3a3a" : "#f8f9fa"}
            >
                <Rect x="20" y="15" rx="8" ry="8" width="30" height="20" />
                <Rect x="70" y="15" rx="8" ry="8" width="30" height="20" />
                <Rect x="130" y="12" rx="6" ry="6" width="120" height="26" />
                <Rect x="270" y="15" rx="8" ry="8" width="30" height="20" />
                <Rect x="320" y="15" rx="8" ry="8" width="30" height="20" />
            </ContentLoader>
        </View>
    );
};

const HomeSkeleton = () => {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <BillingPeriodSelectorSkeleton />

            <View style={styles.contentWrapper}>
                <ScrollView style={styles.scrollView}>
                    <CategoryDonutChartSkeleton compact={true} />
                    <SummaryCardSkeleton />
                    <KeyIndicatorsCardSkeleton />
                    <TagsSummaryCardSkeleton />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentWrapper: {
        flex: 1,
        position: 'relative',
    },
    scrollView: {
        flex: 1,
        paddingBottom: 75,
    },
});

export default HomeSkeleton;