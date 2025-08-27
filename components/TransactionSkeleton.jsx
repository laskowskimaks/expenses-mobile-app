import React from 'react';
import { View, Dimensions } from 'react-native';
import ContentLoader, { Rect, Circle } from 'react-content-loader/native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 24;

const TransactionSkeletonCompact = () => {
    return (
        <View style={{
            marginVertical: 8,
            marginHorizontal: 12,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#f8f9fa'
        }}>
            <ContentLoader
                speed={1.2}
                width={ITEM_WIDTH}
                height={80}
                viewBox={`0 0 ${ITEM_WIDTH} 80`}
                backgroundColor="#e9ecef"
                foregroundColor="#f8f9fa"
            >
                <Rect x="0" y="0" rx="18" ry="18" width={ITEM_WIDTH} height="80" />

                <Circle cx="40" cy="40" r="24" />

                <Rect x="80" y="20" rx="4" ry="4" width="120" height="16" />

                <Rect x="80" y="45" rx="3" ry="3" width="80" height="12" />

                <Rect x={ITEM_WIDTH - 100} y="25" rx="4" ry="4" width="80" height="16" />

                <Rect x="80" y="62" rx="10" ry="10" width="40" height="12" />
                <Rect x="125" y="62" rx="10" ry="10" width="35" height="12" />
                <Rect x="165" y="62" rx="10" ry="10" width="30" height="12" />
            </ContentLoader>
        </View>
    );
};

const TransactionSkeletonExpanded = () => {
    return (
        <View style={{
            marginVertical: 8,
            marginHorizontal: 12,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#f8f9fa'
        }}>
            <ContentLoader
                speed={1.2}
                width={ITEM_WIDTH}
                height={140}
                viewBox={`0 0 ${ITEM_WIDTH} 140`}
                backgroundColor="#e9ecef"
                foregroundColor="#f8f9fa"
            >
                <Rect x="0" y="0" rx="18" ry="18" width={ITEM_WIDTH} height="140" />

                <Circle cx="40" cy="40" r="24" />

                <Rect x="80" y="20" rx="4" ry="4" width="140" height="16" />

                <Rect x="80" y="45" rx="3" ry="3" width="70" height="12" />
                <Circle cx="160" cy="51" r="5" />
                <Rect x="170" y="45" rx="3" ry="3" width="90" height="12" />

                <Rect x={ITEM_WIDTH - 100} y="25" rx="4" ry="4" width="80" height="16" />

                <Circle cx={ITEM_WIDTH - 20} cy="120" r="10" />

                <Rect x="80" y="75" rx="4" ry="4" width={ITEM_WIDTH - 120} height="12" />
                <Rect x="80" y="92" rx="4" ry="4" width={ITEM_WIDTH - 180} height="12" />

                <Rect x="80" y="115" rx="10" ry="10" width="45" height="12" />
                <Rect x="130" y="115" rx="10" ry="10" width="40" height="12" />
                <Rect x="175" y="115" rx="10" ry="10" width="35" height="12" />
                <Rect x="215" y="115" rx="10" ry="10" width="25" height="12" />
            </ContentLoader>
        </View>
    );
};

const TransactionSkeletonMedium = () => {
    return (
        <View style={{
            marginVertical: 8,
            marginHorizontal: 12,
            borderRadius: 20,
            overflow: 'hidden',
            backgroundColor: '#f8f9fa'
        }}>
            <ContentLoader
                speed={1.2}
                width={ITEM_WIDTH}
                height={100}
                viewBox={`0 0 ${ITEM_WIDTH} 100`}
                backgroundColor="#e9ecef"
                foregroundColor="#f8f9fa"
            >
                <Rect x="0" y="0" rx="18" ry="18" width={ITEM_WIDTH} height="100" />

                <Circle cx="40" cy="40" r="24" />

                <Rect x="80" y="18" rx="4" ry="4" width="160" height="16" />

                <Rect x="80" y="42" rx="3" ry="3" width="85" height="12" />
                <Circle cx="175" cy="48" r="4" />
                <Rect x="184" y="42" rx="3" ry="3" width="70" height="12" />

                <Rect x={ITEM_WIDTH - 90} y="22" rx="4" ry="4" width="70" height="16" />

                <Rect x="80" y="70" rx="10" ry="10" width="50" height="12" />
                <Rect x="135" y="70" rx="10" ry="10" width="42" height="12" />
                <Rect x="182" y="70" rx="10" ry="10" width="38" height="12" />
                <Rect x="225" y="70" rx="10" ry="10" width="30" height="12" />
                <Rect x="260" y="70" rx="10" ry="10" width="20" height="12" />
            </ContentLoader>
        </View>
    );
};

const TransactionSkeleton = ({ variant = 'random' }) => {
    if (variant === 'compact') return <TransactionSkeletonCompact />;
    if (variant === 'medium') return <TransactionSkeletonMedium />;
    if (variant === 'expanded') return <TransactionSkeletonExpanded />;

    // Random variant
    const variants = [
        <TransactionSkeletonCompact key="compact" />,
        <TransactionSkeletonMedium key="medium" />,
        <TransactionSkeletonExpanded key="expanded" />
    ];

    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
};

export const TransactionSkeletonList = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }, (_, index) => {
                const variants = ['compact', 'medium', 'expanded', 'expanded', 'medium']; 
                const variant = variants[index % variants.length];
                return <TransactionSkeleton key={index} variant={variant} />;
            })}
        </>
    );
};

export default TransactionSkeleton;