import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatching } from '../contexts/MatchingContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import Avatar from '../components/Avatar';

// Mock data — replace with a chat service / Supabase later.
const MOCK_CHATS = [
  { id: '1', name: 'Bryan', avatar: 'boy1', preview: 'See you at Golden Mile tomorrow!', time: '2m', unread: 2 },
  { id: '2', name: 'Alvin', avatar: 'girl2', preview: 'Thanks for the restaurant recommendation 🙏', time: '1h', unread: 0 },
  { id: '3', name: 'Cindy', avatar: null, preview: 'Do you know any good dental clinics nearby?', time: '3h', unread: 0 },
  { id: '4', name: 'Diana', avatar: 'girl1', preview: "That sounds great, let's plan something for the weekend", time: '1d', unread: 5 },
];

const keyExtractor = (item) => item.id;

function createStyles(c, f) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    // Header (matches Feed)
    header: {
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: c.headerBorder,
      backgroundColor: c.bg,
    },
    headerTitle: {
      fontFamily: f.bold,
      fontSize: 28,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.5,
    },
    listContent: {
      paddingBottom: 96,
    },
    // Chat item (flat, hairline-separated — matches Feed posts)
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: c.headerBorder,
    },
    chatInfo: {
      flex: 1,
    },
    chatTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    chatName: {
      flex: 1,
      fontFamily: f.semibold,
      fontSize: 15,
      fontWeight: '600',
      color: c.text,
    },
    chatNameUnread: {
      fontFamily: f.bold,
      fontWeight: '700',
    },
    chatTime: {
      fontFamily: f.regular,
      fontSize: 12,
      color: c.muted,
      marginLeft: 8,
    },
    chatBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatPreview: {
      flex: 1,
      fontFamily: f.regular,
      fontSize: 14,
      color: c.muted,
    },
    chatPreviewUnread: {
      color: c.textSecondary,
      fontWeight: '500',
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    unreadBadgeText: {
      fontFamily: f.bold,
      fontSize: 11,
      color: '#fff',
      fontWeight: '700',
    },
    // Floating action button
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 16,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: c.text,
          shadowOpacity: 0.25,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        },
        android: { elevation: 6 },
      }),
    },
    fabFinding: {
      backgroundColor: c.primaryEnd,
    },
    fabDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#34c759',
      borderWidth: 2,
      borderColor: '#fff',
    },
    // Empty state
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    emptyIconWrap: {
      width: 104,
      height: 104,
      borderRadius: 52,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    emptyTitle: {
      fontFamily: f.bold,
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 20,
      color: c.textTertiary,
      textAlign: 'center',
      marginBottom: 24,
    },
    meetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    meetButtonText: {
      fontFamily: f.semibold,
      fontSize: 15,
      color: '#fff',
      fontWeight: '600',
    },
  });
}

const ChatItem = memo(function ChatItem({ item, onPress }) {
  const { colors } = useTheme();
  const { font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const unread = item.unread > 0;
  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(item)} activeOpacity={0.6}>
      <Avatar name={item.name} avatar={item.avatar} size={50} />
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text
            style={[styles.chatName, unread && styles.chatNameUnread]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text
            style={[styles.chatPreview, unread && styles.chatPreviewUnread]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.preview}
          </Text>
          {unread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unread > 9 ? '9+' : item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ChatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [chats] = useState(MOCK_CHATS);
  const { status } = useMatching();

  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const isFinding = status !== 'idle';

  // Idle → open the preferences screen; searching/matched → open Matching.
  const handleMeetPeople = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isFinding) {
      navigation.navigate('Matching');
    } else {
      navigation.navigate('FindFriends');
    }
  }, [isFinding, navigation]);

  const handleOpenChat = useCallback((chat) => {
    navigation.navigate('Conversation', { chat });
  }, [navigation]);

  const renderChat = useCallback(
    ({ item }) => <ChatItem item={item} onPress={handleOpenChat} />,
    [handleOpenChat]
  );

  const hasChats = chats.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>{t('chat.title')}</Text>
      </View>

      {hasChats ? (
        <>
          <FlatList
            data={chats}
            keyExtractor={keyExtractor}
            renderItem={renderChat}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={40}
            windowSize={11}
          />

          {/* Floating "meet new people" button — shows finding status while searching */}
          <TouchableOpacity
            style={[styles.fab, isFinding && styles.fabFinding]}
            onPress={handleMeetPeople}
            activeOpacity={0.85}
          >
            {status === 'searching' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="person-add-outline" size={24} color="#fff" />
            )}
            {status === 'matched' && <View style={styles.fabDot} />}
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubbles-outline" size={56} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('chat.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('chat.emptySubtitle')}
          </Text>
          <TouchableOpacity style={styles.meetButton} onPress={handleMeetPeople} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.meetButtonText}>{t('chat.meetNewPeople')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
