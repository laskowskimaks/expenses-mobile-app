import React, { memo, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge, useTheme, Icon } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';

// Zachowujemy RenderIcon, ponieważ może być potrzebny do ikon z różnych rodzin
const RenderIcon = ({ iconName, size = 32, color = '#fff' }) => {
  if (!iconName) {
    return <Icon source="shape" size={size} color={color} />;
  }
  return <Icon source={iconName} size={size} color={color} />;
};

function TransactionItem({
  transaction,
  onPress = null,
  initialExpanded = false,
  maxVisibleTags = 3,
  onEdit,
  onDelete,
  openSwipeableRef
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(initialExpanded);
  const swipeableRef = useRef(null);

  const toggle = useCallback(() => {
    setExpanded((prev) => !prev);
    if (onPress) onPress(transaction);
  }, [onPress, transaction]);

  const handleSwipeableOpen = () => {
    if (openSwipeableRef && openSwipeableRef.current && openSwipeableRef.current !== swipeableRef.current) {
      openSwipeableRef.current.close();
    }
    if (openSwipeableRef) {
      openSwipeableRef.current = swipeableRef.current;
    }
  };

  const handleEdit = useCallback(() => {
    swipeableRef.current?.close();
    onEdit(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(transaction);
  }, [onDelete, transaction]);

  const renderRightActions = useCallback((progress, dragX) => {
    const trans = dragX.interpolate({ inputRange: [-160, 0], outputRange: [0, 160], extrapolate: 'clamp' });
    return (
      <Animated.View style={[styles.rightActionContainer, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Icon source="pencil" size={28} color={theme.colors.primary} />
          <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edytuj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Icon source="trash-can-outline" size={28} color={theme.colors.error} />
          <Text style={[styles.actionText, { color: theme.colors.error }]}>Usuń</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleEdit, handleDelete, theme]);

  if (!transaction) return null;

  const {
    title, amount, categoryName, categoryColor = '#888', categoryIcon,
    location, notes, tags = [], periodicTransactionId, amountFormatted,
  } = transaction;

  const isPeriodicTransaction = Boolean(periodicTransactionId);
  const amountColor = amount < 0 ? theme.colors.error : 'green';

  const { displayedTags, remainingTags } = useMemo(() => {
    const currentTags = tags || []; // Zabezpieczenie na wypadek, gdyby `tags` było null/undefined
    const displayed = expanded ? currentTags : currentTags.slice(0, maxVisibleTags);
    const remaining = expanded ? 0 : Math.max(0, currentTags.length - maxVisibleTags);
    return { displayedTags: displayed, remainingTags: remaining };
  }, [expanded, tags, maxVisibleTags]);

  const gradientColors = [categoryColor, `${categoryColor}00`];

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      overshootRight={false}
      friction={2}
    >
      <View>
        <View style={[styles.container, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradientBackground}
          />
          <TouchableOpacity activeOpacity={0.95} onPress={toggle} style={[styles.contentArea, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.topSection}>
              <View style={styles.leftPart}>
                <View style={[styles.categoryIconWrapper, { backgroundColor: categoryColor }]}>
                  <RenderIcon iconName={categoryIcon} size={32} color="white" />
                </View>
              </View>
              <View style={styles.middlePart}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
                <View style={styles.categoryLocationRow}>
                  <Text style={[styles.categoryText, { color: theme.colors.onSurfaceVariant }]}>{categoryName || 'Inne'}</Text>
                  {location && (
                    <View style={styles.locationContainer}>
                      <Icon source="map-marker" size={14} color={theme.colors.onSurfaceVariant} style={styles.locationIcon} />
                      <Text style={[styles.locationText, { color: theme.colors.onSurfaceVariant }]}>{location}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.rightPart}>
                <Text style={[styles.amountText, { color: amountColor }]}>{amountFormatted}</Text>
                <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                  {transaction.transactionDate ? new Date(transaction.transactionDate * 1000).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            </View>

            {expanded && !!notes && (
              <View style={styles.descriptionSection}>
                <Text style={[styles.notesText, { color: theme.colors.onSurfaceVariant }]}>{notes}</Text>
              </View>
            )}

            {(tags || []).length > 0 && (
              <View style={styles.tagsSection}>
                {displayedTags.map((t) => (
                  <View key={t.id ?? t.name} style={[styles.tag, { borderColor: t.color, backgroundColor: `${t.color}20` }]}>
                    <Text style={[styles.tagText, { color: t.color }]}>{t.name}</Text>
                  </View>
                ))}
                {remainingTags > 0 && (
                  <View style={[styles.tag, { borderColor: theme.colors.onSurfaceVariant, backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>+{remainingTags}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

        </View>
        {isPeriodicTransaction && (
          <Badge style={[styles.periodicBadgeAbsolute, { backgroundColor: '#78cfbd' }]} size={22}>
            <Icon source="calendar" size={14} color="#ffffff" />
          </Badge>
        )}
      </View>
    </Swipeable>
  );
}
export default memo(TransactionItem);

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    paddingVertical: 4,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentArea: {
    borderRadius: 18,
    padding: 8,
    marginLeft: 6,
  },
  rightActionContainer: {
    width: 160,
    flexDirection: 'row',
    marginBottom: 8,
    marginRight: 10,
    borderRadius: 20,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftPart: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  middlePart: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center'
  },
  categoryLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
  },
  rightPart: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  notesText: {
    lineHeight: 18,
    fontSize: 13,
  },
  tagsSection: {
    marginTop: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodicBadgeAbsolute: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
});
