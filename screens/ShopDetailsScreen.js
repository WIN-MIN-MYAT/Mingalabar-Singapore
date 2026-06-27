import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import { mapStyles } from '../constants/mapStyles';
import { UpvoteIcon, DownvoteIcon } from '../components/VoteIcons';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useCategories';
import { getShopReviews, getMyReview, addShopReview, voteShopReview } from '../services/shopService';

const MAP_HEIGHT = 160;
const MIN_FEEDBACK_LEN = 10;
const MAX_REVIEW_LINES = 3;

function formatTimeAgo(isoString, t) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('common.time.now');
  if (diffMins < 60) return t('common.time.m', { count: diffMins });
  if (diffHours < 24) return t('common.time.h', { count: diffHours });
  if (diffDays < 7) return t('common.time.d', { count: diffDays });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function starsCreateStyles(c, f) {
  return StyleSheet.create({
    starsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
  });
}

function Stars({ value, size = 14, onChange }) {
  const { colors } = useTheme();
  const { font } = useI18n();
  const styles = useMemo(() => starsCreateStyles(colors, font), [colors, font]);
  const interactive = !!onChange;
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity
          key={i}
          disabled={!interactive}
          activeOpacity={0.6}
          onPress={() => onChange?.(i)}
          hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
        >
          <Ionicons
            name={i <= value ? 'star' : 'star-outline'}
            size={size}
            color={i <= value ? '#FFB800' : colors.borderStrong}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function avatarCreateStyles(c, f) {
  return StyleSheet.create({
    avatar: {
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    avatarText: {
      fontFamily: f.bold,
      color: '#fff',
      fontWeight: '700',
    },
  });
}

function Avatar({ name, size = 36 }) {
  const { colors } = useTheme();
  const { font } = useI18n();
  const styles = useMemo(() => avatarCreateStyles(colors, font), [colors, font]);
  const initial = (name || 'U').charAt(0).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

const CAROUSEL_HEIGHT = 200;

function carouselCreateStyles(c, f) {
  return StyleSheet.create({
    carousel: {
      width: '100%',
      height: CAROUSEL_HEIGHT,
      backgroundColor: c.surface,
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 14,
    },
    carouselDots: {
      position: 'absolute',
      bottom: 10,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
    },
    carouselDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    carouselDotActive: {
      width: 16,
      borderRadius: 3,
      backgroundColor: '#fff',
    },
  });
}

function ImageCarousel({ images }) {
  const { colors } = useTheme();
  const { font } = useI18n();
  const styles = useMemo(() => carouselCreateStyles(colors, font), [colors, font]);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(Dimensions.get('window').width);

  const handleScroll = (event) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View
      style={styles.carousel}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((uri, i) => (
          <Image
            key={i}
            source={{ uri }}
            style={{ width, height: CAROUSEL_HEIGHT }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.carouselDots}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[styles.carouselDot, i === index && styles.carouselDotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function reviewItemCreateStyles(c, f) {
  return StyleSheet.create({
    reviewItem: {
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
    },
    reviewHead: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    reviewHeadInfo: {
      flex: 1,
      gap: 2,
    },
    reviewAuthor: {
      fontFamily: f.semibold,
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    reviewMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    reviewDot: {
      fontSize: 11,
      color: c.textTertiary,
    },
    reviewTime: {
      fontFamily: f.medium,
      fontSize: 11,
      color: c.primary,
      fontWeight: '500',
    },
    reviewEdited: {
      fontFamily: f.regular,
      fontSize: 10,
      fontStyle: 'italic',
      color: c.textTertiary,
      marginLeft: 2,
    },
    reviewContent: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 22,
      color: c.textSecondary,
      marginBottom: 10,
    },
    seeMore: {
      fontFamily: f.medium,
      fontSize: 13,
      color: c.primary,
      fontWeight: '500',
      marginTop: -4,
    },
    reviewActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
    voteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    voteCount: {
      fontFamily: f.medium,
      fontSize: 13,
      color: c.textTertiary,
      fontWeight: '500',
    },
  });
}

const ReviewItem = memo(function ReviewItem({ review, onVote }) {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => reviewItemCreateStyles(colors, font), [colors, font]);
  const upvoteScale = useRef(new Animated.Value(1)).current;
  const downvoteScale = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [textMeasured, setTextMeasured] = useState(false);

  const handleTextLayout = (event) => {
    if (textMeasured) return;
    setTextMeasured(true);
    if (event.nativeEvent.lines.length > MAX_REVIEW_LINES) {
      setShowSeeMore(true);
    }
  };

  const handleVote = (type) => {
    const scaleAnim = type === 'up' ? upvoteScale : downvoteScale;
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.15, friction: 8, tension: 200, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 200, useNativeDriver: true }),
    ]).start();
    onVote?.(review.id, type);
  };

  const isEdited = !!review.updatedAt && review.updatedAt !== review.createdAt;
  const timeText = formatTimeAgo(isEdited ? review.updatedAt : review.createdAt, t);

  return (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHead}>
        <Avatar name={review.author} size={36} />
        <View style={styles.reviewHeadInfo}>
          <Text style={styles.reviewAuthor} numberOfLines={1}>{review.author}</Text>
          <View style={styles.reviewMeta}>
            <Stars value={review.rating} size={12} />
            <Text style={styles.reviewDot}>·</Text>
            <Text style={styles.reviewTime}>{timeText}</Text>
            {isEdited && <Text style={styles.reviewEdited}>{t('community.shop.edited')}</Text>}
          </View>
        </View>
      </View>

      {!textMeasured ? (
        <Text style={styles.reviewContent} onTextLayout={handleTextLayout}>
          {review.content}
        </Text>
      ) : isExpanded ? (
        <View>
          <Text style={styles.reviewContent}>{review.content}</Text>
          <TouchableOpacity onPress={() => setIsExpanded(false)} activeOpacity={0.7}>
            <Text style={styles.seeMore}>{t('common.seeLess')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text
            style={styles.reviewContent}
            numberOfLines={MAX_REVIEW_LINES}
            ellipsizeMode="tail"
          >
            {review.content}
          </Text>
          {showSeeMore && (
            <TouchableOpacity onPress={() => setIsExpanded(true)} activeOpacity={0.7}>
              <Text style={styles.seeMore}>{t('common.seeMore')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.voteItem} onPress={() => handleVote('up')} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: upvoteScale }] }}>
            <UpvoteIcon size={20} color={review.userVote === 'up' ? '#FF4500' : colors.textTertiary} filled={review.userVote === 'up'} />
          </Animated.View>
          <Text style={[styles.voteCount, review.userVote === 'up' && { color: '#FF4500' }]}>{review.upvotes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.voteItem} onPress={() => handleVote('down')} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: downvoteScale }] }}>
            <DownvoteIcon size={20} color={review.userVote === 'down' ? '#7193FF' : colors.textTertiary} filled={review.userVote === 'down'} />
          </Animated.View>
          <Text style={[styles.voteCount, review.userVote === 'down' && { color: '#7193FF' }]}>{review.downvotes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

function shopCreateStyles(c, f) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scroll: {
      flex: 1,
    },
    loadingReviews: {
      paddingVertical: 24,
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingBottom: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.border,
      backgroundColor: c.bg,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: f.bold,
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    headerSpacer: {
      width: 40,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    // Section label
    sectionLabel: {
      fontFamily: f.bold,
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginTop: 24,
      marginBottom: 10,
    },
    // Shop identity (flat — no card)
    shopName: {
      fontFamily: f.bold,
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    shopMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    shopCategory: {
      fontFamily: f.medium,
      fontSize: 13,
      color: c.primary,
      fontWeight: '500',
    },
    metaDot: {
      fontSize: 12,
      color: c.textTertiary,
    },
    shopRatingText: {
      fontFamily: f.semibold,
      fontSize: 13,
      color: c.text,
      fontWeight: '600',
    },
    shopRatingCount: {
      fontFamily: f.regular,
      fontSize: 12,
      color: c.textTertiary,
    },
    shopDescription: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 21,
      color: c.textSecondary,
      marginTop: 10,
    },
    // Map
    mapCard: {
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    map: {
      width: '100%',
      height: MAP_HEIGHT,
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
    // Write review
    writeCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    },
    fieldLabel: {
      fontFamily: f.medium,
      fontSize: 12,
      color: c.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    feedbackScroll: {
      maxHeight: 160,
      backgroundColor: c.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    feedbackScrollContent: {
      flexGrow: 1,
    },
    feedbackInput: {
      fontFamily: f.regular,
      fontSize: 14,
      color: c.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 84,
      lineHeight: 20,
    },
    fieldHint: {
      fontFamily: f.regular,
      fontSize: 11,
      color: c.textTertiary,
      alignSelf: 'flex-end',
      marginTop: 6,
      marginBottom: 2,
    },
    submitButton: {
      marginTop: 14,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.4,
    },
    submitText: {
      fontFamily: f.semibold,
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    // Empty reviews
    emptyReviews: {
      alignItems: 'center',
      paddingVertical: 30,
      gap: 6,
    },
    emptyReviewsText: {
      fontFamily: f.semibold,
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 6,
    },
    emptyReviewsSub: {
      fontFamily: f.regular,
      fontSize: 13,
      color: c.textTertiary,
    },
  });
}

export default function ShopDetailsScreen({ visible, shop, onClose }) {
  const insets = useSafeAreaInsets();
  const { userId, profile } = useAuth();
  const { typeIcon: TYPE_ICON } = useCategories();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => shopCreateStyles(colors, font), [colors, font]);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReviewId, setMyReviewId] = useState(null);

  // Load reviews from Supabase whenever a shop is opened.
  useEffect(() => {
    if (!visible || !shop) return;
    let active = true;
    setLoadingReviews(true);
    setRating(0);
    setFeedback('');
    setMyReviewId(null);

    Promise.all([
      getShopReviews(shop.id, userId),
      getMyReview(shop.id, userId),
    ])
      .then(([data, mine]) => {
        if (!active) return;
        setReviews(data);
        if (mine) {
          // Pre-fill the form with the user's existing review (edit mode).
          setMyReviewId(mine.id);
          setRating(mine.rating);
          setFeedback(mine.content || '');
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => {
        if (active) setLoadingReviews(false);
      });
    return () => {
      active = false;
    };
  }, [visible, shop?.id, userId]);

  const handleSubmit = useCallback(async () => {
    if (!rating || feedback.trim().length < MIN_FEEDBACK_LEN || submitting || !shop || !userId) return;
    setSubmitting(true);
    try {
      const created = await addShopReview(shop.id, userId, rating, feedback.trim());
      setReviews((prev) => {
        // Replace the user's existing review if they edited it.
        const without = prev.filter((r) => r.id !== created.id);
        return [created, ...without];
      });
      setMyReviewId(created.id);
      // Keep the text filled so the user sees their saved review.
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('RATE_LIMIT') || msg.includes('COOLDOWN')) {
        Alert.alert(t('community.shop.rateLimitTitle'), t('community.shop.rateLimitBody'));
      } else if (msg.includes('UNVERIFIED')) {
        Alert.alert(t('community.shop.unverifiedTitle'), t('community.shop.unverifiedBody'));
      } else {
        console.error('Failed to post review:', err);
        Alert.alert(t('community.shop.errorTitle'), t('community.shop.errorBody'));
      }
    } finally {
      setSubmitting(false);
    }
  }, [rating, feedback, submitting, shop, userId, t]);

  const handleVote = useCallback((reviewId, type) => {
    // Optimistic update of counts + the user's vote in the parent state.
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id !== reviewId) return r;
        let { upvotes, downvotes, userVote } = r;
        if (userVote === type) {
          // tapping the active vote removes it
          if (type === 'up') upvotes -= 1;
          else downvotes -= 1;
          userVote = null;
        } else {
          // flip from the other vote, then apply the new one
          if (userVote === 'up') upvotes -= 1;
          else if (userVote === 'down') downvotes -= 1;
          if (type === 'up') upvotes += 1;
          else downvotes += 1;
          userVote = type;
        }
        return { ...r, upvotes, downvotes, userVote };
      })
    );
    if (!userId) return;
    voteShopReview(userId, reviewId, type).catch((err) =>
      console.error('Failed to record vote:', err)
    );
  }, [userId]);

  if (!shop) return null;

  const iconName = TYPE_ICON[shop.type] || 'location';
  const reviewCount = reviews.length;
  const hasReviews = reviewCount > 0;
  const numericAvg = hasReviews
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : shop.rating || 0;
  const avgDisplay = hasReviews
    ? numericAvg.toFixed(1)
    : shop.rating > 0
      ? shop.rating.toFixed(1)
      : t('community.shop.new');
  const countText = hasReviews ? `(${reviewCount})` : '';

  const listHeader = (
    <View>
      {/* Photos */}
      {shop.images && shop.images.length > 0 && <ImageCarousel images={shop.images} />}

      {/* Shop identity */}
      <View>
        <Text style={styles.shopName}>{shop.name}</Text>
        <View style={styles.shopMeta}>
          <Ionicons name={iconName} size={14} color={colors.primary} />
          <Text style={styles.shopCategory}>{shop.category}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Stars value={Math.round(numericAvg)} size={14} />
          <Text style={styles.shopRatingText}>{avgDisplay}</Text>
          <Text style={styles.shopRatingCount}>{countText}</Text>
        </View>
        {!!shop.description && (
          <Text style={styles.shopDescription}>{shop.description}</Text>
        )}
      </View>

      {/* Location */}
      <Text style={styles.sectionLabel}>{t('community.shop.sectionLocation')}</Text>
      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          customMapStyle={mapStyles[colors.isDark ? 'dark' : 'light']}
          initialRegion={{
            latitude: shop.lat,
            longitude: shop.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={{ latitude: shop.lat, longitude: shop.lng }}>
            <View style={styles.markerPin}>
              <Ionicons name={iconName} size={16} color="#fff" />
            </View>
          </Marker>
        </MapView>
      </View>

      {/* Write a review */}
      <Text style={styles.sectionLabel}>{t(myReviewId ? 'community.shop.yourReview' : 'community.shop.writeReview')}</Text>
      <View style={styles.writeCard}>
        <Text style={styles.fieldLabel}>{t('community.shop.yourRating')}</Text>
        <Stars value={rating} size={28} onChange={setRating} />
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t('community.shop.yourFeedback')}</Text>
        <ScrollView
          style={styles.feedbackScroll}
          contentContainerStyle={styles.feedbackScrollContent}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          <TextInput
            style={styles.feedbackInput}
            placeholder={t('community.shop.feedbackPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            scrollEnabled={false}
            maxLength={500}
            textAlignVertical="top"
          />
        </ScrollView>
        <Text style={styles.fieldHint}>
          {feedback.trim().length > 0 && feedback.trim().length < MIN_FEEDBACK_LEN
            ? t('community.shop.charsNeeded', { count: MIN_FEEDBACK_LEN - feedback.trim().length })
            : t('community.shop.charsCount', { count: feedback.length })}
        </Text>
        <TouchableOpacity
          style={[styles.submitButton, (rating < 1 || feedback.trim().length < MIN_FEEDBACK_LEN) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating < 1 || feedback.trim().length < MIN_FEEDBACK_LEN || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>{t(myReviewId ? 'community.shop.updateReview' : 'community.shop.postReview')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reviews */}
      <Text style={styles.sectionLabel}>
        {hasReviews ? t('community.shop.reviewsWithCount', { count: reviewCount }) : t('community.shop.reviews')}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {listHeader}

          {loadingReviews ? (
            <View style={styles.loadingReviews}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.borderStrong} />
              <Text style={styles.emptyReviewsText}>{t('community.shop.emptyReviews')}</Text>
              <Text style={styles.emptyReviewsSub}>{t('community.shop.emptyReviewsSub')}</Text>
            </View>
          ) : (
            reviews.map((item) => (
              <ReviewItem key={item.id} review={item} onVote={handleVote} />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
