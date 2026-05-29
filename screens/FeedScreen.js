import React, { useState, useRef, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { UpvoteIcon, DownvoteIcon } from '../components/VoteIcons';
import CommentModal from '../components/CommentModal';
import { getFeed, getPostStats } from '../services/feedService';
import { vote } from '../services/voteService';
import { useAuth } from '../hooks/useAuth';



const { width } = Dimensions.get('window');

const TAG_COLORS = {
  'health': '#66BB6A',
  'tips': '#BA68C8',
  'knowledge': '#64B5F6',
  'news': '#FF8A65',
  'community': '#FFD54F',
  'announcement': '#E57373',
  'မြန်မာ': '#4CAF50',
  'နည်းပညာ': '#2196F3',
  'ပညာရေး': '#FF9800',
};

const MAX_TEXT_LINES = 3;

function PostTags({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => {
        const tagColor = TAG_COLORS[tag.toLowerCase()] || '#666';
        const displayTag = tag.charAt(0).toUpperCase() + tag.slice(1);
        return (
          <Text key={index} style={[styles.tagText, { color: tagColor }]}>
            #{displayTag}{' '}
          </Text>
        );
      })}
    </View>
  );
}

const SNAP_RATIOS = [
  { ratio: 9 / 16, label: '16:9' },   // 0.5625 landscape
  { ratio: 1 / 1,  label: '1:1' },    // 1.0 square
  { ratio: 5 / 4,  label: '4:5' },    // 1.25 portrait
];

function snapToRatio(actualRatio) {
  let closest = SNAP_RATIOS[0];
  let minDiff = Math.abs(actualRatio - closest.ratio);
  for (const r of SNAP_RATIOS) {
    const diff = Math.abs(actualRatio - r.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }
  return closest.ratio;
}

function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageHeights, setImageHeights] = useState({});
  const scrollViewRef = useRef(null);

  useEffect(() => {
    images.forEach((uri, index) => {
      if (imageHeights[index] !== undefined) return;
      Image.getSize(uri, (imgWidth, imgHeight) => {
        const snapped = snapToRatio(imgHeight / imgWidth);
        setImageHeights(prev => ({ ...prev, [index]: width * snapped }));
      }, () => {
        setImageHeights(prev => ({ ...prev, [index]: width }));
      });
    });
  }, [images]);

  if (!images || images.length === 0) return null;

  const allLoaded = images.every((_, i) => imageHeights[i] !== undefined);
  const containerHeight = allLoaded
    ? imageHeights[0]
    : width;

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  const goToImage = useCallback((index) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  }, []);

  return (
    <View style={[styles.carouselContainer, { height: containerHeight }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((imageUri, index) => (
          <View key={index} style={[styles.imageWrapper, { height: containerHeight }]}>
            <Image
              source={{ uri: imageUri }}
              style={[styles.postImage, { height: imageHeights[index] || containerHeight }]}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {images.length > 1 && (
        <View style={styles.carouselDots}>
          <View style={styles.dotsBackground}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.dotActive,
                ]}
                onPress={() => goToImage(index)}
                activeOpacity={0.6}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const Post = memo(function Post({ post, onOpenComments, onVote, userId }) {
  const [userVote, setUserVote] = useState(post.userVote);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [textMeasured, setTextMeasured] = useState(false);

  const upvoteScaleAnim = useRef(new Animated.Value(1)).current;
  const downvoteScaleAnim = useRef(new Animated.Value(1)).current;

  const handleVote = async (type) => {
    if (Platform.OS === 'ios') {
      if (userVote === type) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const scaleAnim = type === 'up' ? upvoteScaleAnim : downvoteScaleAnim;

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        friction: 10,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const previousUserVote = userVote;

    if (userVote === type) {
      if (type === 'up') {
        setUpvotes(upvotes - 1);
      } else {
        setDownvotes(downvotes - 1);
      }
      setUserVote(null);
    } else {
      if (userVote === 'up') {
        setUpvotes(upvotes - 1);
      } else if (userVote === 'down') {
        setDownvotes(downvotes - 1);
      }

      if (type === 'up') {
        setUpvotes(upvotes + 1);
      } else {
        setDownvotes(downvotes + 1);
      }
      setUserVote(type);
    }

    if (userId) {
      try {
        await onVote(userId, post.id, type);
      } catch (error) {
        console.error('Vote failed, reverting:', error);
        setUserVote(previousUserVote);
        if (type === 'up') {
          setUpvotes(userVote === 'up' ? upvotes + 1 : upvotes);
        } else {
          setDownvotes(userVote === 'down' ? downvotes + 1 : downvotes);
        }
      }
    }
  };

  const handleTextLayout = (event) => {
    const { lines } = event.nativeEvent;
    if (!textMeasured) {
      setTextMeasured(true);
      if (lines.length > MAX_TEXT_LINES) {
        setShowSeeMore(true);
      }
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <View style={styles.postContainer}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.timestamp}>{post.author} • {post.timestamp}</Text>
      </View>

      {/* Content */}
      <View style={styles.postContent}>
        {!textMeasured ? (
          <Text
            style={styles.textContent}
            onTextLayout={handleTextLayout}
          >
            {post.content}
          </Text>
        ) : (
          <>
            {isExpanded ? (
              <View>
                <Text style={styles.textContent}>
                  {post.content}
                </Text>
                <TouchableOpacity onPress={() => setIsExpanded(false)} activeOpacity={0.7}>
                  <Text style={styles.seeMore}>See Less</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.textContent} numberOfLines={MAX_TEXT_LINES} ellipsizeMode="tail">
                  {post.content}
                </Text>
                {showSeeMore && (
                  <TouchableOpacity onPress={() => setIsExpanded(true)} activeOpacity={0.7}>
                    <Text style={styles.seeMore}>See More</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
        <PostTags tags={post.tags} />
      </View>

      {/* Image Carousel */}
      <ImageCarousel images={post.images} />

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleVote('up')}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: upvoteScaleAnim }] }}>
              <UpvoteIcon size={24} color={userVote === 'up' ? '#FF4500' : '#666'} filled={userVote === 'up'} />
            </Animated.View>
            <Text style={styles.actionCount}>{formatNumber(upvotes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleVote('down')}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: downvoteScaleAnim }] }}>
              <DownvoteIcon size={24} color={userVote === 'down' ? '#7193FF' : '#666'} filled={userVote === 'down'} />
            </Animated.View>
            <Text style={styles.actionCount}>{formatNumber(downvotes)}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionItemRight}
          activeOpacity={0.7}
          onPress={() => onOpenComments?.(post)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionCount}>{formatNumber(post.comments)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

function SkeletonBox({ width, height, style }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ReAnimated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: '#e0e3e5' }, style, animStyle]}
    />
  );
}

function SkeletonPost() {
  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <SkeletonBox width="70%" height={18} style={{ marginBottom: 6 }} />
        <SkeletonBox width="40%" height={12} />
      </View>
      <View style={styles.postContent}>
        <SkeletonBox width="100%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="90%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonBox width="60%" height={14} />
      </View>
      <SkeletonBox width={width} height={width * 0.6} style={{ borderRadius: 0, marginBottom: 12 }} />
      <View style={[styles.actionsContainer, { paddingHorizontal: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SkeletonBox width={24} height={24} style={{ marginRight: 24, borderRadius: 12 }} />
          <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        </View>
        <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
      </View>
    </View>
  );
}

function FeedHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Feed</Text>
    </View>
  );
}

export default function FeedScreen({ onOpenComments }) {
  const { userId, isAuthenticated } = useAuth();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentPost, setCommentPost] = useState(null);
  const PAGE_SIZE = 20;

  const fetchPosts = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }

      const { posts: newPosts, total } = await getFeed({
        limit: PAGE_SIZE,
        skip: pageNum * PAGE_SIZE,
        userId,
      });

      setPosts(prevPosts => (isRefresh || pageNum === 0) ? newPosts : [...prevPosts, ...newPosts]);
      setHasMore((pageNum + 1) * PAGE_SIZE < total);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, PAGE_SIZE]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = useCallback(() => {
    fetchPosts(0, true);
  }, [fetchPosts]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading) return;
    fetchPosts(page + 1);
  }, [hasMore, loading, page, fetchPosts]);

  const handleVote = useCallback(async (uid, postId, voteType) => {
    try {
      await vote(uid, postId, voteType);
    } catch (error) {
      console.error('Vote error:', error);
      throw error;
    }
  }, []);

  const handleOpenComments = useCallback((post) => {
    setCommentPost(post);
  }, []);

  const handleCommentAdded = useCallback((postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
      )
    );
  }, []);

  const renderFooter = useCallback(() => {
    if (!hasMore || loading) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [hasMore, loading]);

  const renderItem = useCallback(({ item }) => (
    <Post post={item} onOpenComments={handleOpenComments} onVote={handleVote} userId={userId} />
  ), [handleOpenComments, handleVote, userId]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (!fontsLoaded) return null;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <FeedHeader />
        <FlatList
          data={[1, 2, 3]}
          renderItem={() => <SkeletonPost />}
          keyExtractor={(item) => String(item)}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FeedHeader />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      <CommentModal post={commentPost} onClose={() => setCommentPost(null)} onCommentAdded={handleCommentAdded} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    letterSpacing: -0.5,
  },
  notificationButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    paddingVertical: 16,
  },
  postHeader: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  postTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 0,
  },
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#00288e',
  },
  authorName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#00288e',
    fontWeight: '500',
  },
  postContent: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 24,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 3,
  },
  carouselContainer: {
    width: width,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  postImage: {
    width: width,
  },
  imageWrapper: {
    width: width,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 8,
  },
  seeMore: {
    fontFamily: 'Inter_500Medium',
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});