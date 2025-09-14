import React from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router'
import { useTheme } from 'react-native-paper';
import { Feather, FontAwesome5, Foundation } from '@expo/vector-icons';

const ICON_MAP = {
    home: (props) => <FontAwesome5 name="home" {...props} />,
    transactionListScreen: (props) => <Foundation name="list" {...props} />,
    add: (props) => <Feather name="plus" {...props} />,
    cards: (props) => <FontAwesome5 name="barcode" {...props} />,
    settings: (props) => <FontAwesome5 name="cog" {...props} />,
};

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.9;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

const CustomTabBar = ({ state }) => {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);

    const ROUTE_MAP = {
        home: '/(tabs)/home',
        transactionListScreen: '/(tabs)/transactionListScreen',
        add: '/(modals)/AddTransactionModal',
        cards: '/(tabs)/cards',
        settings: '/(tabs)/settings',
    };

    return (
        <View style={[styles.tabBarContainer, { bottom: 10 }]}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const isFocused = state.index === index;
                    const isCentralButton = route.name === 'add';
                    const routePath = ROUTE_MAP[route.name];

                    const onPress = () => {
                        if (isCentralButton) {
                            router.push('/(modals)/AddTransactionModal');
                        } else if (!isFocused) {
                            router.push(routePath);
                        }
                    };

                    const IconComponent = ICON_MAP[route.name];

                    if (!IconComponent) {
                        console.warn(`[CustomTabBar] Brak ikony dla route: ${route.name}`);
                        return null;
                    }

                    if (isCentralButton) {
                        return (
                            <Pressable
                                key={route.key}
                                onPress={onPress}
                                style={styles.centralButtonContainer}
                            >
                                <View style={styles.centralButton}>
                                    {IconComponent({ size: 50, color: '#ffffff' })}
                                </View>
                            </Pressable>
                        );
                    }

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <View style={[
                                styles.iconContainer,
                                isFocused && styles.iconContainerFocused
                            ]}>
                                {IconComponent({
                                    size: isFocused ? 26 : 24,
                                    color: isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant,
                                })}
                            </View>
                            {isFocused && <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        elevation: 8,
    },
    tabBar: {
        flexDirection: 'row',
        height: 65,
        width: TAB_BAR_WIDTH,
        backgroundColor: theme.colors.elevation.level2,
        borderRadius: 15.5,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: theme.dark ? 'rgba(0,0,0,0.8)' : '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: theme.dark ? 0.3 : 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: TAB_WIDTH,
    },
    iconContainer: {
        padding: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
        minHeight: 40,
    },
    iconContainerFocused: {
        backgroundColor: theme.colors.primaryContainer,
        transform: [{ scale: 1.1 }],
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 6,
        width: 20,
        height: 2,
        borderRadius: 1,
    },
    centralButtonContainer: {
        width: TAB_WIDTH,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centralButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -10 }],
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
});

export default CustomTabBar;