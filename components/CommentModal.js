import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getComments, addComment } from '../services/commentService';
import { useAuth } from '../hooks/useAuth';

function CommentItem({ comment }) {
  const displayName = comment.profiles?.username || comment.profiles?.full_name || 'User';
  const timeAgo = formatTimeAgo(comment.created_at);

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{displayName}</Text>
          <Text style={styles.commentTime}>{timeAgo}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
}

function formatTimeAgo(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CommentModal({ post, onClose }) {
  const { userId } = useAuth();
  const bottomSheetRef = useRef(null);
  const hasPresented = useRef(false);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => ['60%', '90%'], []);

  useEffect(() => {
    if (post) {
      hasPresented.current = true;
      setComments([]);
      setNewComment('');
      setLoading(true);
      bottomSheetRef.current?.present();
      getComments(post.id)
        .then(setComments)
        .catch((error) => console.error('Failed to load comments:', error))
        .finally(() => setLoading(false));
    } else if (hasPresented.current) {
      bottomSheetRef.current?.dismiss();
    }
  }, [post]);

  const handleSubmit = useCallback(async () => {
    if (!newComment.trim() || !post || !userId) return;
    setSubmitting(true);
    try {
      const comment = await addComment(userId, post.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setSubmitting(false);
    }
  }, [newComment, post, userId]);

  const handleDismiss = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  const renderBackdrop = useCallback((props) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
    />
  ), []);

  const renderComment = useCallback(({ item }) => (
    <CommentItem comment={item} />
  ), []);

  const listHeader = useCallback(() => (
    <View style={styles.sheetHeader}>
      <Text style={styles.sheetTitle}>Comments</Text>
      <Text style={styles.sheetCount}>{comments.length}</Text>
    </View>
  ), [comments.length]);

  const renderFooter = useCallback(() => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          placeholderTextColor="#757684"
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
            <ActivityIndicator size="small" color="#00288e" />
          ) : (
            <Ionicons name="send" size={20} color={newComment.trim() ? '#00288e' : '#c4c5d5'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  ), [newComment, submitting, handleSubmit, insets.bottom]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      onDismiss={handleDismiss}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00288e" />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          {listHeader()}
          <Ionicons name="chatbubble-outline" size={48} color="#c4c5d5" />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubtext}>Be the first to share your thoughts</Text>
        </View>
      ) : (
        <BottomSheetFlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  sheetCount: {
    fontSize: 13,
    color: '#757684',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444653',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#757684',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444653',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
    marginRight: 8,
  },
  commentTime: {
    fontSize: 11,
    color: '#757684',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444653',
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    backgroundColor: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f2f4f6',
    borderRadius: 20,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#191c1e',
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
