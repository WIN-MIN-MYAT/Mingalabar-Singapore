import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import ShopDetailsScreen from './ShopDetailsScreen';
import { getShops } from '../services/shopService';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { mapStyles } from '../constants/mapStyles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MIN_HEIGHT = SCREEN_HEIGHT * 0.38;
const MAX_HEIGHT = SCREEN_HEIGHT * 0.92;

const springConfig = {
  damping: 26,
  stiffness: 220,
  mass: 1,
};

const keyExtractor = (item) => item.id;

// Memoized so only the previously- and newly-selected cards re-render on tap.
const ShopCard = memo(function ShopCard({ item, isSelected, typeIcon, onSelect, onOpenDetails }) {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      activeOpacity={0.7}
      onPress={() => (isSelected ? onOpenDetails(item) : onSelect(item))}
    >
      {isSelected && <View style={styles.cardAccent} />}
      <View style={styles.cardImage}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImageImg} resizeMode="cover" />
        ) : (
          <Ionicons name={typeIcon[item.type] || 'location-outline'} size={24} color={isSelected ? colors.primary : colors.borderStrong} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, isSelected && styles.cardNameSelected]} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
        <View style={styles.cardRating}>
          <Ionicons name="star" size={12} color="#FFB800" />
          <Text style={styles.cardRatingText}>
            {item.reviewCount > 0 ? Number(item.rating).toFixed(1) : t('community.shop.new')}
          </Text>
        </View>
      </View>
      {isSelected && (
        <View style={styles.cardChevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function CommunityScreen() {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const mapRef = useRef(null);
  const mapHeight = useSharedValue(MIN_HEIGHT);
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { categories: CATEGORIES, typeIcon: TYPE_ICON } = useCategories();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadShops = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShops();
      setShops(data);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  // Keep latest values in refs so the list callbacks stay stable (don't
  // invalidate the memoized cards / FlatList renderItem).
  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;
  const selectedIdRef = useRef(selectedLocation?.id);
  selectedIdRef.current = selectedLocation?.id;

  const toggleMap = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    mapHeight.value = withSpring(next ? MAX_HEIGHT : MIN_HEIGHT, springConfig);
  };

  const goToLocation = useCallback((loc) => {
    setSelectedLocation(loc);
    if (!mapRef.current) return;
    const latDelta = 0.01;
    const currentHeight = isExpandedRef.current ? MAX_HEIGHT : MIN_HEIGHT;
    const latOffset = ((MAX_HEIGHT - currentHeight) / 2 / ((MAX_HEIGHT + currentHeight * 2) / 3)) * latDelta;
    mapRef.current.animateToRegion(
      {
        latitude: loc.lat - latOffset,
        longitude: loc.lng,
        latitudeDelta: latDelta,
        longitudeDelta: latDelta,
      },
      500
    );
  }, []);

  const openDetails = useCallback(() => {
    setShowDetails(true);
  }, []);

  const filteredLocations = shops.filter((loc) => {
    const matchesCategory = activeCategory === 'all' || loc.type === activeCategory;
    const matchesSearch = loc.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
  }));

  const renderCard = useCallback(
    ({ item }) => (
      <ShopCard
        item={item}
        isSelected={selectedIdRef.current === item.id}
        typeIcon={TYPE_ICON}
        onSelect={goToLocation}
        onOpenDetails={openDetails}
      />
    ),
    [TYPE_ICON, goToLocation, openDetails]
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.mapContainer, mapAnimatedStyle]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 1.3521,
            longitude: 103.8198,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          customMapStyle={mapStyles[colors.isDark ? 'dark' : 'light']}
        >
          {selectedLocation && (
            <Marker
              key={selectedLocation.id}
              coordinate={{ latitude: selectedLocation.lat, longitude: selectedLocation.lng }}
              title={selectedLocation.name}
            >
              <View style={styles.markerPin}>
                <Ionicons name={TYPE_ICON[selectedLocation.type] || 'location'} size={16} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
        <TouchableOpacity style={styles.expandBtn} onPress={toggleMap}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('community.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.borderStrong} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, activeCategory === cat.id && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon}
                size={14}
                color={activeCategory === cat.id ? '#fff' : colors.textTertiary}
              />
              <Text
                style={[styles.filterLabel, activeCategory === cat.id && styles.filterLabelActive]}
              >
                {t(`community.cat.${cat.id}`, { defaultValue: cat.label })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredLocations}
          style={styles.list}
          keyExtractor={keyExtractor}
          renderItem={renderCard}
          extraData={selectedLocation?.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={32} color={colors.borderStrong} />
                <Text style={styles.emptyText}>{t('community.empty')}</Text>
              </View>
            )
          }
        />
      </View>

      <ShopDetailsScreen
        visible={showDetails}
        shop={selectedLocation}
        onClose={() => {
          setShowDetails(false);
          loadShops();
        }}
      />
    </View>
  );
}

function createStyles(c, f) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    mapContainer: {
      width: '100%',
      overflow: 'hidden',
    },
    map: {
      height: MAX_HEIGHT,
    },
    expandBtn: {
      position: 'absolute',
      bottom: 25,
      right: 12,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 5 },
      }),
    },
    bottomSection: {
      flex: 1,
      backgroundColor: c.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: -20,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 10,
      paddingHorizontal: 12,
      height: 42,
      borderRadius: 12,
      backgroundColor: c.surface,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontFamily: f.regular,
      fontSize: 14,
      color: c.text,
      paddingVertical: 0,
    },
    filterScrollView: {
      flexGrow: 0,
      marginVertical: 4,
    },
    filterRow: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      gap: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 20,
      gap: 5,
      borderWidth: 1,
      borderColor: c.border,
    },
    filterChipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    filterLabel: {
      fontFamily: f.medium,
      fontSize: 13,
      fontWeight: '500',
      color: c.textSecondary,
    },
    filterLabelActive: {
      color: '#fff',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    card: {
      flexDirection: 'row',
      backgroundColor: c.bg,
      borderRadius: 14,
      marginBottom: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    cardSelected: {
      borderColor: c.primary,
      backgroundColor: c.surfaceAlt,
    },
    cardAccent: {
      width: 4,
      backgroundColor: c.primary,
    },
    cardNameSelected: {
      color: c.primary,
    },
    cardChevron: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 8,
    },
    cardImage: {
      width: 80,
      height: 80,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardImageImg: {
      width: 80,
      height: 80,
    },
    cardInfo: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 12,
      gap: 3,
    },
    cardName: {
      fontFamily: f.semibold,
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    cardCategory: {
      fontFamily: f.medium,
      fontSize: 12,
      color: c.primary,
    },
    cardRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    cardRatingText: {
      fontFamily: f.medium,
      fontSize: 12,
      fontWeight: '500',
      color: c.textSecondary,
    },
    markerPin: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: '#fff',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        },
        android: { elevation: 4 },
      }),
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
    },
    emptyText: {
      fontFamily: f.regular,
      fontSize: 14,
      color: c.textTertiary,
    },
  });
}
