import React, { useEffect, useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Badge } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { formatCurrency } from '@/services/transactionService';


// Render ikony
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

export default memo(function TransactionItem({
  transaction,
  onPress = null,
  initialExpanded = false,
  maxVisibleTags = 3,
}) {
  const [expanded, setExpanded] = useState(initialExpanded);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
    if (onPress) onPress(transaction);
  };

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
    transactionDate,
    isPeriodic,
    repeatInterval,
    repeatUnit,
    endDate,
    nextOccurrenceDate,
  } = transaction;

  const isPeriodicTransaction = Boolean(
    isPeriodic || 
    repeatInterval || 
    repeatUnit || 
    nextOccurrenceDate ||
    // sprawdź czy w notes jest informacja o automatycznym dodaniu
    (notes && notes.includes('(transakcja dodana automatycznie)'))
  );

  const amountText = formatCurrency(amount);
  const amountColor = amount < 0 ? '#ff3b30' : '#0a9d58';

  // W expanded mode  wszystkie tagi
  const displayedTags = expanded ? tags : tags.slice(0, maxVisibleTags);
  const remainingTags = expanded ? 0 : Math.max(0, tags.length - maxVisibleTags);

  // Gradient na całą długość
  const gradientColors = [
    categoryColor || '#6ac6b6',
    `${categoryColor || '#6ac6b6'}00`
  ];

  return (
    <TouchableOpacity activeOpacity={0.95} onPress={toggle} style={styles.container}>
      {/* GRADIENT BACKGROUND */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradientBackground}
      />

      {/* BIAŁA PRZESTRZEŃ NA TREŚĆ */}
      <View style={styles.contentArea}>
        {/* górna sekcja - ikona, tytuł, kwota */}
        <View style={styles.topSection}>
          {/* ikona */}
          <View style={styles.leftPart}>
            <View style={[styles.categoryIconWrapper, { backgroundColor: categoryColor }]}>
              <RenderIcon iconName={categoryIcon} size={34} color="white" />
            </View>
          </View>

          {/* środek - tytuł, kategoria, lokalizacja */}
          <View style={styles.middlePart}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.categoryLocationRow}>
              <Text style={styles.categoryText}>{categoryName || 'Inne'}</Text>
              {location && (
                <View style={styles.locationContainer}>
                  <MaterialCommunityIcons 
                    name="map-marker" 
                    size={14} 
                    color="#777" 
                    style={styles.locationIcon} 
                  />
                  <Text style={styles.locationText}>{location}</Text>
                </View>
              )}
            </View>
          </View>

          {/* prawa kolumna: kwota */}
          <View style={styles.rightPart}>
            <Text style={[styles.amountText, { color: amountColor }]}>{amountText}</Text>
          </View>
        </View>

        {/* Opis */}
        {expanded && !!notes && (
          <View style={styles.descriptionSection}>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Tagi - czarne */}
        {tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsRow}>
              {displayedTags.map((t) => (
                <View key={t.id ?? t.name} style={styles.tag}>
                  <Text style={styles.tagText}>{t.name}</Text>
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

        {/* ✅ Badge kalendarza - zawsze w prawym dolnym rogu */}
        {isPeriodicTransaction && (
          <Badge
            style={[
              styles.periodicBadgeAbsolute,
              { backgroundColor: '#78cfbd' }
            ]}
            size={22}
          >
            <MaterialCommunityIcons
              name="calendar"
              size={14}
              color="#ffffff"
            />
          </Badge>
        )}
      </View>
    </TouchableOpacity>
  );

});

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
    position: 'relative',
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
    borderColor: '#000000',
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
    color: '#000000',
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
    bottom: 8,
    right: 8,
  },
});