import React, { memo, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

const RenderIcon = ({ iconName, size = 32, color = '#333' }) => {
  if (!iconName) {
    return <MaterialCommunityIcons name="shape" size={size} color={color} />;
  }
  if (iconName.includes(':')) {
    const [family, name] = iconName.split(':');
    const props = { name, size, color };
    switch (family) {
      case 'MaterialCommunityIcons': return <MaterialCommunityIcons {...props} />;
      case 'Ionicons': return <Ionicons {...props} />;
      case 'FontAwesome': return <FontAwesome {...props} />;
      default: return <MaterialCommunityIcons {...props} />;
    }
  }
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
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
    const trans = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.rightActionContainer, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <MaterialCommunityIcons name="pencil" size={28} color="#007aff" />
          <Text style={styles.editText}>Edytuj</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={28} color="#ff3b30" />
          <Text style={styles.deleteText}>Usuń</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [handleEdit, handleDelete]);

  if (!transaction) return null;

  const {
    title,
    amount,
    categoryName,
    categoryColor = '#6ac6b6',
    categoryIcon,
    location,
    notes,
    tags = [],
    periodicTransactionId,
    amountFormatted,
  } = transaction;

  const isPeriodicTransaction = Boolean(periodicTransactionId);
  const amountColor = amount < 0 ? '#ff3b30' : '#0a9d58';

  const { displayedTags, remainingTags } = useMemo(() => {
    const currentTags = tags || [];
    const displayed = expanded ? currentTags : currentTags.slice(0, maxVisibleTags);
    const remaining = expanded ? 0 : Math.max(0, currentTags.length - maxVisibleTags);
    return { displayedTags: displayed, remainingTags: remaining };
  }, [expanded, tags, maxVisibleTags]);

  const gradientColors = [
    categoryColor || '#6ac6b6',
    `${categoryColor || '#6ac6b6'}00`
  ];

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeableOpen}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity activeOpacity={0.95} onPress={toggle} style={styles.container}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBackground}
        />
        <View style={styles.contentArea}>
          <View style={styles.topSection}>
            <View style={styles.leftPart}>
              <View style={[styles.categoryIconWrapper, { backgroundColor: categoryColor }]}>
                <RenderIcon iconName={categoryIcon} size={34} color="white" />
              </View>
            </View>
            <View style={styles.middlePart}>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.categoryLocationRow}>
                <Text style={styles.categoryText}>{categoryName || 'Inne'}</Text>
                {location && (
                  <View style={styles.locationContainer}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#777" style={styles.locationIcon} />
                    <Text style={styles.locationText}>{location}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.rightPart}>
              <Text style={[styles.amountText, { color: amountColor }]}>{amountFormatted}</Text>
              <Text style={styles.dateText}>
                {transaction.transactionDate ?
                  new Date(transaction.transactionDate * 1000).toLocaleString('pl-PL', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  }) : ''}
              </Text>
            </View>
          </View>

          {expanded && !!notes && (
            <View style={styles.descriptionSection}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}

          {tags.length > 0 && (
            <View style={styles.tagsSection}>
              <View style={styles.tagsRow}>
                {displayedTags.map((t) => (
                  <View key={t.id ?? t.name} style={[styles.tag, { borderColor: t.color || '#000000' }]}>
                    <Text style={[styles.tagText, { color: t.color || '#000000' }]}>{t.name}</Text>
                  </View>
                ))}
                {remainingTags > 0 && (
                  <View style={styles.tagMore}>
                    <Text style={styles.tagMoreText}>+{remainingTags}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {isPeriodicTransaction && (
        <Badge style={[styles.periodicBadgeAbsolute, { backgroundColor: '#78cfbd' }]} size={22}>
          <MaterialCommunityIcons name="calendar" size={14} color="#ffffff" />
        </Badge>
      )}
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
    position: 'relative',
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
  },
  rightActionContainer: {
    width: 160,
    flexDirection: 'row',
    marginBottom: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  editText: {
    color: '#007aff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  deleteText: {
    color: '#ff3b30',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
  },
  contentArea: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 8,
    marginLeft: 6,
    marginRight: 8,
    marginTop: -2,
    marginBottom: -2,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftPart: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
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
    fontSize: 13,
    color: '#777',
  },
  rightPart: {
    width: 125,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingRight: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginVertical: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  descriptionSection: {
    marginTop: 12,
    paddingLeft: 2,
  },
  notesText: {
    color: '#333',
    lineHeight: 20,
    fontSize: 14,
    textAlign: 'left',
  },
  tagsSection: {
    marginTop: 10,
    paddingLeft: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#fff'
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagMore: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  tagMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  periodicBadgeAbsolute: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
});