import React from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router'
import { Feather, FontAwesome5, Foundation } from '@expo/vector-icons';

const ICON_MAP = {
    home: (props) => <FontAwesome5 name="home" {...props} />,
    details: (props) => <Foundation name="list" {...props} />,
    add: (props) => <Feather name="plus" {...props} />,
    cards: (props) => <FontAwesome5 name="credit-card" {...props} />,
    settings: (props) => <FontAwesome5 name="cog" {...props} />,
};

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width * 0.9;
const TAB_WIDTH = TAB_BAR_WIDTH / 5;

const CustomTabBar = ({ state }) => {
    const { bottom } = useSafeAreaInsets();
    const router = useRouter();

    const ROUTE_MAP = {
        home: '/(tabs)/home',
        details: '/(tabs)/details',
        add: '/(modals)/AddTransactionModal',
        cards: '/(tabs)/cards',
        settings: '/(tabs)/settings',
    };

    return (
        <View style={[styles.tabBarContainer, { bottom: bottom + 10 }]}>
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
                            {IconComponent({
                                size: 24,
                                color: isFocused ? '#007BFF' : '#8e8e93',
                            })}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
        backgroundColor: '#ffffff',
        borderRadius: 15.5,
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
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
        backgroundColor: '#007BFF',
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ translateY: -10 }],
        shadowColor: '#007BFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
});

export default CustomTabBar;