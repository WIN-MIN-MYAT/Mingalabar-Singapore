import React, { memo, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReAnimated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getComments, addComment } from '../services/commentService';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import AvGirl1 from '../assets/avatar/av_girl1.svg';
import AvGirl2 from '../assets/avatar/av_girl2.svg';
import AvGirl3 from '../assets/avatar/av_girl3.svg';
import AvGirl4 from '../assets/avatar/av_girl4.svg';
import AvBoy1 from '../assets/avatar/av_boy1.svg';
import AvBoy2 from '../assets/avatar/av_boy2.svg';
import AvBoy3 from '../assets/avatar/av_boy3.svg';
import AvBoy4 from '../assets/avatar/av_boy4.svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;

const AVATAR_MAP = {
  boy1: AvBoy1,
  boy2: AvBoy2,
  boy3: AvBoy3,
  boy4: AvBoy4,
  girl1: AvGirl1,
  girl2: AvGirl2,
  girl3: AvGirl3,
  girl4: AvGirl4,
};

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

function SkeletonBox({ w, h, style }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.3);
  opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <ReAnimated.View
      style={[{ width: w, height: h, borderRadius: 6, backgroundColor: colors.surfaceAlt }, style, animStyle]}
    />
  );
}

function SkeletonComment() {
  const { colors } = useTheme();
  const { font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  return (
    <View style={styles.commentItem}>
      <SkeletonBox w={32} h={32} style={{ borderRadius: 16 }} />
      <View style={styles.commentBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <SkeletonBox w={80} h={12} style={{ marginRight: 8 }} />
          <SkeletonBox w={30} h={10} />
        </View>
        <SkeletonBox w="100%" h={12} style={{ marginBottom: 4 }} />
        <SkeletonBox w="70%" h={12} />
      </View>
    </View>
  );
}

function createStyles(c, f) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    sheet: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      overflow: 'hidden',
    },
    handleBar: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderStrong,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sheetTitle: {
      fontFamily: f.bold,
      fontSize: 16,
      fontWeight: '700',
      color: c.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyList: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 66,
    },
    emptyContainer: {
      alignItems: 'center',
    },
    emptyText: {
      fontFamily: f.semibold,
      fontSize: 15,
      fontWeight: '600',
      color: c.textSecondary,
      marginTop: 12,
    },
    emptySubtext: {
      fontFamily: f.regular,
      fontSize: 13,
      color: c.textTertiary,
      marginTop: 4,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    commentItem: {
      flexDirection: 'row',
      paddingVertical: 10,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      overflow: 'hidden',
      borderWidth: 0.5,
      borderColor: c.primary,
    },
    avatarClip: {
      width: 32,
      height: 32,
      borderRadius: 16,
      overflow: 'hidden',
    },
    avatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentAvatarText: {
      fontFamily: f.semibold,
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    commentBody: {
      flex: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    commentUsername: {
      fontFamily: f.semibold,
      fontSize: 13,
      fontWeight: '600',
      color: c.text,
      marginRight: 8,
    },
    commentTime: {
      fontFamily: f.medium,
      fontSize: 11,
      color: c.primary,
    },
    commentText: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 24,
      color: c.textSecondary,
    },
    inputBar: {
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.bg,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingLeft: 14,
      paddingRight: 4,
      paddingVertical: 4,
    },
    input: {
      fontFamily: f.regular,
      flex: 1,
      fontSize: 14,
      color: c.text,
      maxHeight: 80,
      paddingVertical: 6,
    },
    sendButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
}

const CommentItem = memo(function CommentItem({ comment }) {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const displayName = comment.profiles?.username || comment.profiles?.full_name || t('feed.comment.anonymous');
  const avatarUrl = comment.profiles?.avatar_url;
  const SvgAvatar = avatarUrl && AVATAR_MAP[avatarUrl];
  const isUrl = avatarUrl && (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://'));

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {SvgAvatar ? (
          <View style={styles.avatarClip}>
            <SvgAvatar width={32} height={32} />
          </View>
        ) : isUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.commentAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{displayName}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at, t)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
});

export default function CommentModal({ post, onClose, onCommentAdded }) {
  const { userId } = useAuth();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const mountedRef = useRef(true);

  const visible = post !== null;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Keyboard handling
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e) => {
      Animated.timing(keyboardOffset, {
        toValue: -(e.endCoordinates.height + 12),
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: true,
      }).start();
    };

    const onHide = () => {
      keyboardOffset.setValue(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Sheet open/close
  useEffect(() => {
    if (visible) {
      setComments([]);
      setNewComment('');
      setLoading(true);

      getComments(post.id)
        .then((data) => {
          if (mountedRef.current) setComments(data);
        })
        .catch((err) => console.error('Failed to load comments:', err))
        .finally(() => {
          if (mountedRef.current) setLoading(false);
        });

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (mountedRef.current) onClose?.();
    });
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || !post || !userId || submitting) return;
    const text = newComment.trim();
    setNewComment('');
    setSubmitting(true);
    try {
      const comment = await addComment(userId, post.id, text);
      setComments((prev) => [...prev, comment]);
      onCommentAdded?.(post.id);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setNewComment(text);
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [newComment, post, userId, submitting]);

  const renderComment = useCallback(({ item }) => (
    <CommentItem comment={item} />
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderListHeader = useCallback(() => (
    <View style={styles.sheetHeader}>
      <Text style={styles.sheetTitle}>{t('feed.comment.title')}</Text>
      <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={22} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  ), [handleClose, styles, t, colors]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.borderStrong} />
      <Text style={styles.emptyText}>{t('feed.comment.empty')}</Text>
      <Text style={styles.emptySubtext}>{t('feed.comment.emptySub')}</Text>
    </View>
  ), [styles, t, colors]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_HEIGHT,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          {renderListHeader()}

          {/* Comment list */}
          {loading ? (
            <View style={styles.listContent}>
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonComment key={i} />
              ))}
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={comments}
              keyExtractor={keyExtractor}
              renderItem={renderComment}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={
                comments.length === 0
                  ? styles.emptyList
                  : [styles.listContent, { paddingBottom: Math.max(insets.bottom, 12) + 56 }]
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews
              initialNumToRender={12}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={40}
              windowSize={11}
            />
          )}

          {/* Input bar - absolute positioned, only this moves with keyboard */}
          <Animated.View
            style={[
              styles.inputBar,
              {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                paddingBottom: Math.max(insets.bottom, 12),
                transform: [{ translateY: keyboardOffset }],
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={t('feed.comment.placeholder')}
                placeholderTextColor={colors.textTertiary}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
                onPress={handleSubmit}
                disabled={!newComment.trim() || submitting}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={newComment.trim() ? colors.primary : colors.borderStrong}
                  />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
