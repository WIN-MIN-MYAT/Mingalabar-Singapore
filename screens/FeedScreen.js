import React, { useState, useRef, useCallback, memo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Sample data
const SAMPLE_POSTS = [
  {
    id: '1',
    title: 'Community Launch Announcement',
    content: '🎉 Welcome to our community! We are excited to have you here.',
    author: 'Admin Team',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=600&fit=crop',
    ],
    timestamp: '2h ago',
    upvotes: 124,
    downvotes: 3,
    comments: 18,
    userVote: null,
    tags: ['community', 'announcement'],
  },
  {
    id: '2',
    title: 'Major Platform Update Coming Soon',
    content: '📢 New feature announcement coming next week! This is going to be a major update that brings new functionality and improvements to the platform. We have been working on this for months and we cannot wait to share it with all of you. Stay tuned for more details!',
    author: 'Tech News',
    images: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    ],
    timestamp: '5h ago',
    upvotes: 89,
    downvotes: 5,
    comments: 32,
    userVote: null,
    tags: ['announcement', 'news'],
  },
  {
    id: '3',
    title: 'နေပြည်တော် နည်းပညာ ဖွံ့ဖြိုးတိုးတက်မှု အစီရင်ခံစာ',
    content: '🇲🇲 မြန်မာနိုင်ငံတွင် နည်းပညာ ဖွံ့ဖြိုးတိုးတက်မှုသည် နှစ်စဉ်နှစ်တိုင်း တိုးတက်လျက်ရှိပါသည်။ လက်ရှိအချိန်တွင် စတအတ်တပ်ခန်း ၂၀၀ ကျော် ဖွင့်လှစ်ပြီး လူငယ် လူရွယ် ၅၀,၀၀၀ ကျော်က နည်းပညာ သင်တန်း သင်ကြားလျက်ရှိကြပါသည်။ ဒီနှစ်မှာတော့ အစိုးရက ဒစ်ဂျစ်တယ် စီးပွားရေး ပညာရေး မူဘောင် အသစ် မိတ်ဆက်ခဲ့ပါတယ်။ ဒါကြောင့် စွမ်းရည် ရှိပြီး ကျွမ်းကျင်သူ ပညာရှင်များ ပိုမို ပေါ်ပေါက်လာပါမယ်။ နောက်ထပ် နည်းပညာ ကုမ္ပဏီ ၁၀၀ ကျော်လည်း နိုင်ငံတကာ ကုမ္ပဏီများနဲ့ ပူးပေါင်း ဆောင်ရွက်နေပါတယ်။',
    author: 'မြန်မာနည်းပညာ',
    images: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=600&fit=crop',
    ],
    timestamp: '1h ago',
    upvotes: 245,
    downvotes: 8,
    comments: 56,
    userVote: null,
    tags: ['မြန်မာ', 'နည်းပညာ', 'ပညာရေး'],
  },
];

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

function ImageCarousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  if (!images || images.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setCurrentIndex(newIndex);
  };

  const goToImage = useCallback((index: number) => {
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  }, []);

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={styles.postImage}
            resizeMode="cover"
          />
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

const Post = memo(function Post({ post, onOpenComments }) {
  const [userVote, setUserVote] = useState(post.userVote);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const [textMeasured, setTextMeasured] = useState(false);

  const upvoteScaleAnim = useRef(new Animated.Value(1)).current;
  const downvoteScaleAnim = useRef(new Animated.Value(1)).current;

  const handleVote = (type) => {
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
        toValue: 1.2,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

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
            <Ionicons
              name={userVote === 'up' ? 'arrow-up' : 'arrow-up-outline'}
              size={20}
              color={userVote === 'up' ? '#FF4500' : '#666'}
            />
            <Text style={styles.actionCount}>{formatNumber(upvotes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => handleVote('down')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={userVote === 'down' ? 'arrow-down' : 'arrow-down-outline'}
              size={20}
              color={userVote === 'down' ? '#7193FF' : '#666'}
            />
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

function FeedHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Feed</Text>
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
}

export default function FeedScreen({ onOpenComments }) {
  const renderItem = useCallback(({ item }) => <Post post={item} onOpenComments={onOpenComments} />, [onOpenComments]);
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <FeedHeader />
      <FlatList
        data={SAMPLE_POSTS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(_, index) => ({
          length: 500,
          offset: 500 * index,
          index,
        })}
      />
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
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 0,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  authorName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  postContent: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 3,
  },
  carouselContainer: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  postImage: {
    width: width,
    height: width * 0.6,
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
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
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
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});