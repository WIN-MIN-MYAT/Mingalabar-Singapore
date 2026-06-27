import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Image,
  Animated,
  Keyboard,
  Platform,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import Avatar from '../components/Avatar';
import { searchGifs, GIF_FALLBACK } from '../services/gifService';

const INITIAL_MESSAGES = (() => {
  const now = Date.now();
  const min = 60 * 1000;
  const hr = 60 * min;
  const iso = (ms) => new Date(ms).toISOString();
  return [
    { id: 'm1', sender: 'them', type: 'text', content: 'Hey! Are we still meeting at Golden Mile tomorrow?', createdAt: iso(now - 3 * hr) },
    { id: 'm2', sender: 'me', type: 'text', content: 'Yes! 7pm works for me 👍', createdAt: iso(now - 3 * hr + min), status: 'delivered' },
    { id: 'm3', sender: 'them', type: 'gif', content: GIF_FALLBACK[1], aspect: 1, createdAt: iso(now - 2 * hr) },
    { id: 'm4', sender: 'me', type: 'text', content: "Haha that's perfect, see you then!", createdAt: iso(now - 2 * hr + min), status: 'delivered' },
  ];
})();

// GIFs render as plain images (no bubble) sized to their natural aspect ratio,
// capped so very wide/tall GIFs stay reasonable.
const GIF_MAX_W = 240;
const GIF_MAX_H = 240;
const gifSize = (aspect) => {
  if (!aspect) return { width: GIF_MAX_W, height: 180 };
  let w = GIF_MAX_W;
  let h = w / aspect;
  if (h > GIF_MAX_H) {
    h = GIF_MAX_H;
    w = h * aspect;
  }
  return { width: w, height: h };
};

const keyExtractor = (item) => item.id;

// Messages within this gap from the same sender are grouped (tighter spacing,
// single timestamp on the last one).
const GROUP_GAP_MS = 5 * 60 * 1000;

function toDate(d) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), x.getDate());
}
function sameDay(a, b) {
  return toDate(a).getTime() === toDate(b).getTime();
}
function withinGap(a, b) {
  return Math.abs(new Date(b).getTime() - new Date(a).getTime()) <= GROUP_GAP_MS;
}
function formatTime(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}
function formatDaySeparator(iso, t) {
  const d = toDate(iso);
  const today = toDate(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime()) return t('conversation.today');
  if (d.getTime() === yesterday.getTime()) return t('conversation.yesterday');
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: toDate(iso).getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

const MessageBubble = memo(function MessageBubble({
  message,
  showStatus,
  startNewDay,
  continuesGroup,
  showTime,
}) {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createMessageBubbleStyles(colors, font), [colors, font]);

  const mine = message.sender === 'me';
  const { width, height } = message.type === 'gif' ? gifSize(message.aspect) : {};

  let meta = null;
  if (mine && showStatus) {
    meta = (
      <View style={styles.statusRow}>
        <Ionicons
          name={message.status === 'delivered' ? 'checkmark' : 'time-outline'}
          size={11}
          color={colors.muted}
        />
        <Text style={styles.statusText}>
          {message.status === 'delivered' ? t('conversation.delivered') : t('conversation.sending')}
        </Text>
      </View>
    );
  } else if (showTime && message.createdAt) {
    meta = <Text style={styles.msgTime}>{formatTime(message.createdAt)}</Text>;
  }

  return (
    <View style={[styles.msgWrap, continuesGroup && styles.msgWrapTight]}>
      {startNewDay && message.createdAt && (
        <View style={styles.dateRow}>
          <View style={styles.dateChip}>
            <Text style={styles.dateChipText}>{formatDaySeparator(message.createdAt, t)}</Text>
          </View>
        </View>
      )}

      <View style={mine ? styles.colMine : styles.colTheirs}>
        {message.type === 'gif' ? (
          <Image
            source={{ uri: message.content }}
            style={[styles.gif, { width, height }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.content}</Text>
          </View>
        )}
        {meta}
      </View>
    </View>
  );
});

function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }) {
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createConfirmDialogStyles(colors, font), [colors, font]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogCard}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="log-out-outline" size={28} color={colors.error} />
          </View>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogButtonCancel} onPress={onCancel} activeOpacity={0.7}>
              <Text style={styles.dialogCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogButtonConfirm} onPress={onConfirm} activeOpacity={0.8}>
              <Text style={styles.dialogConfirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function GifPicker({ visible, onClose, onPick, customerId }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createGifPickerStyles(colors, font), [colors, font]);
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef(null);

  // Ad slot size — roughly one grid cell wide.
  const adMaxWidth = Math.round(Dimensions.get('window').width / 3);

  const load = useCallback(
    async (q) => {
      setLoading(true);
      try {
        const items = await searchGifs(q, { customerId, adMaxWidth, adMaxHeight: 250 });
        setGifs(items);
      } catch (e) {
        console.error('GIF load failed:', e);
      } finally {
        setLoading(false);
      }
    },
    [customerId, adMaxWidth]
  );

  // Ad taps fire the impression beacon and open the sponsor landing page —
  // they are NOT sent into the chat.
  const handleAdTap = useCallback((item) => {
    if (item.impressionUrl) {
      fetch(item.impressionUrl).catch(() => {});
    }
    if (item.clickUrl) {
      Linking.openURL(item.clickUrl).catch((e) => console.warn('Ad open failed:', e));
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      return;
    }
    load('');
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [visible, load]);

  const handleSearch = (text) => {
    setQuery(text);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(text.trim()), 400);
  };

  const clearSearch = () => {
    setQuery('');
    load('');
  };

  const renderGif = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.gifCell}
        onPress={() => (item.isAd ? handleAdTap(item) : onPick(item.url, item.aspect))}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.url }} style={styles.gifThumb} resizeMode="contain" />
        {item.isAd && (
          <View style={styles.adBadge}>
            <Text style={styles.adBadgeText}>Ad</Text>
          </View>
        )}
      </TouchableOpacity>
    ),
    [onPick, handleAdTap]
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.pickerOverlay}>
        <TouchableOpacity style={styles.pickerBackdrop} onPress={onClose} activeOpacity={1} />
        <View
          style={[
            styles.pickerSheet,
            { height: Dimensions.get('window').height * 0.64, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.pickerHandle} />
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{t('conversation.gifs')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerSearchWrap}>
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput
              style={styles.pickerSearch}
              placeholder={t('conversation.searchGifs')}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={colors.borderStrong} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.pickerGridWrap}>
            {loading && gifs.length === 0 ? (
              <View style={styles.pickerLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={gifs}
                keyExtractor={(item, i) => `${i}`}
                renderItem={renderGif}
                numColumns={3}
                contentContainerStyle={styles.pickerGrid}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews
                initialNumToRender={12}
                windowSize={7}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ConversationScreen({ navigation, route }) {
  const chat = route?.params?.chat;
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [gifPickerVisible, setGifPickerVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const listRef = useRef(null);

  // Keyboard handling — same approach as the feed comment sheet: the input bar
  // is absolutely positioned and translates up with the keyboard.
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e) => {
      Animated.timing(keyboardOffset, {
        toValue: -e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: true,
      }).start();
    };
    const onHide = () => {
      Animated.timing(keyboardOffset, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardOffset]);

  // Reset to the seed conversation whenever a different chat is opened.
  useEffect(() => {
    setMessages(INITIAL_MESSAGES);
    setInput('');
    setGifPickerVisible(false);
    setConfirmVisible(false);
  }, [chat?.id]);

  // Keep the latest message in view (newest is at the bottom of the list).
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 60);
    return () => clearTimeout(t);
  }, [messages]);

  const doEndChat = useCallback(() => {
    setConfirmVisible(false);
    // TODO: delete the conversation via your chat service.
    navigation.goBack();
  }, [navigation]);

  const pushMessage = useCallback((msg) => {
    setMessages((prev) => [...prev, msg]);
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'delivered' } : m))
      );
    }, 600);
  }, []);

  const sendText = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    pushMessage({
      id: `m-${Date.now()}`,
      sender: 'me',
      type: 'text',
      content: text,
      createdAt: new Date().toISOString(),
      status: 'sending',
    });
  }, [input, pushMessage]);

  const sendGif = useCallback(
    (url, aspect) => {
      setGifPickerVisible(false);
      pushMessage({
        id: `m-${Date.now()}`,
        sender: 'me',
        type: 'gif',
        content: url,
        aspect,
        createdAt: new Date().toISOString(),
        status: 'sending',
      });
    },
    [pushMessage]
  );

  // Index of the most recent outgoing message — only that one shows "Delivered".
  const lastSentIndex = messages.map((m) => m.sender).lastIndexOf('me');

  const renderMessage = useCallback(
    ({ item, index }) => {
      const prev = messages[index - 1];
      const next = messages[index + 1];
      const hasTime = !!item.createdAt;
      const startNewDay = hasTime && (!prev || !prev.createdAt || !sameDay(prev.createdAt, item.createdAt));
      const continuesGroup =
        !!prev &&
        prev.sender === item.sender &&
        !!prev.createdAt &&
        hasTime &&
        sameDay(prev.createdAt, item.createdAt) &&
        withinGap(prev.createdAt, item.createdAt);
      const groupEnd =
        !hasTime ||
        !next ||
        !next.createdAt ||
        next.sender !== item.sender ||
        !sameDay(next.createdAt, item.createdAt) ||
        !withinGap(item.createdAt, next.createdAt);

      return (
        <MessageBubble
          message={item}
          showStatus={item.sender === 'me' && index === lastSentIndex}
          startNewDay={startNewDay}
          continuesGroup={continuesGroup}
          showTime={groupEnd}
        />
      );
    },
    [messages, lastSentIndex]
  );

  if (!chat) return null;

  const canSend = input.trim().length > 0;

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Avatar name={chat.name} avatar={chat.avatar} size={36} />
            <Text style={styles.headerName} numberOfLines={1}>{chat.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setConfirmVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Messages (newest at the bottom; auto-scrolls to the latest) */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 84 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={40}
          windowSize={11}
        />

        {/* Input bar — floats above the keyboard */}
        <Animated.View
          style={[
            styles.inputBar,
            { paddingBottom: insets.bottom + 8, transform: [{ translateY: keyboardOffset }] },
          ]}
        >
          <TouchableOpacity
            style={styles.gifButton}
            onPress={() => setGifPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.gifButtonLabel}>GIF</Text>
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={t('conversation.messagePlaceholder')}
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={sendText}
            disabled={!canSend}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <GifPicker
        visible={gifPickerVisible}
        onClose={() => setGifPickerVisible(false)}
        onPick={sendGif}
        customerId={userId}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title={t('conversation.endChatTitle')}
        message={t('conversation.endChatMessage')}
        confirmLabel={t('conversation.endChat')}
        onConfirm={doEndChat}
        onCancel={() => setConfirmVisible(false)}
      />
    </>
  );
}

// ── createStyles functions ──

function createMessageBubbleStyles(c, f) {
  return StyleSheet.create({
    msgWrap: {
      marginBottom: 12,
    },
    msgWrapTight: {
      marginBottom: 3,
    },
    dateRow: {
      alignItems: 'center',
      marginVertical: 12,
    },
    dateChip: {
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
    },
    dateChipText: {
      fontFamily: f.semibold,
      fontSize: 11,
      color: c.muted,
      fontWeight: '600',
    },
    colMine: {
      alignItems: 'flex-end',
    },
    colTheirs: {
      alignItems: 'flex-start',
    },
    bubble: {
      maxWidth: '78%',
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 16,
    },
    bubbleMine: {
      backgroundColor: c.primary,
      borderBottomRightRadius: 5,
    },
    bubbleTheirs: {
      backgroundColor: c.bubbleTheirs,
      borderBottomLeftRadius: 5,
    },
    bubbleText: {
      fontFamily: f.regular,
      fontSize: 15,
      lineHeight: 21,
      color: c.text,
    },
    bubbleTextMine: {
      color: '#fff',
    },
    gif: {
      borderRadius: 12,
      backgroundColor: c.surface,
    },
    msgTime: {
      fontFamily: f.medium,
      fontSize: 11,
      color: c.muted,
      fontWeight: '500',
      marginTop: 3,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 3,
    },
    statusText: {
      fontFamily: f.medium,
      fontSize: 11,
      color: c.muted,
      fontWeight: '500',
    },
  });
}

function createConfirmDialogStyles(c, f) {
  return StyleSheet.create({
    dialogOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.overlay,
      padding: 28,
    },
    dialogCard: {
      width: '100%',
      backgroundColor: c.bg,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    dialogIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(186, 26, 26, 0.10)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    dialogTitle: {
      fontFamily: f.bold,
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    dialogMessage: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 20,
      color: c.textTertiary,
      textAlign: 'center',
      marginBottom: 22,
    },
    dialogActions: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    dialogButtonCancel: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialogCancelText: {
      fontFamily: f.semibold,
      fontSize: 14,
      color: c.textSecondary,
      fontWeight: '600',
    },
    dialogButtonConfirm: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      backgroundColor: c.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialogConfirmText: {
      fontFamily: f.semibold,
      fontSize: 14,
      color: '#fff',
      fontWeight: '600',
    },
  });
}

function createGifPickerStyles(c, f) {
  return StyleSheet.create({
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    pickerBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    pickerSheet: {
      backgroundColor: c.bg,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden',
    },
    pickerHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderStrong,
      alignSelf: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 8,
    },
    pickerTitle: {
      fontFamily: f.bold,
      fontSize: 16,
      color: c.text,
    },
    pickerSearchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      height: 40,
      backgroundColor: c.surface,
      borderRadius: 12,
    },
    pickerSearch: {
      flex: 1,
      fontFamily: f.regular,
      fontSize: 14,
      color: c.text,
      paddingVertical: 0,
    },
    pickerGridWrap: {
      flex: 1,
    },
    pickerLoading: {
      paddingVertical: 30,
      alignItems: 'center',
    },
    pickerGrid: {
      padding: 8,
    },
    gifCell: {
      flex: 1 / 3,
      padding: 4,
    },
    gifThumb: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 10,
      backgroundColor: c.surface,
    },
    adBadge: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    adBadgeText: {
      fontFamily: f.bold,
      fontSize: 9,
      color: '#fff',
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}

function createStyles(c, f) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    // Header (matches Feed)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      paddingBottom: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.headerBorder,
      backgroundColor: c.bg,
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingLeft: 8,
    },
    headerName: {
      flex: 1,
      fontFamily: f.bold,
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    // Messages
    messagesList: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 14,
      paddingTop: 14,
    },
    // Input bar (absolute, floats with keyboard)
    inputBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: c.headerBorder,
      backgroundColor: c.bg,
    },
    gifButton: {
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    gifButtonLabel: {
      fontFamily: f.bold,
      fontSize: 13,
      color: c.primary,
      fontWeight: '700',
    },
    inputWrap: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 4,
      marginBottom: 4,
    },
    input: {
      fontFamily: f.regular,
      fontSize: 15,
      color: c.text,
      maxHeight: 96,
      paddingVertical: 6,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    sendButtonDisabled: {
      backgroundColor: c.borderStrong,
    },
  });
}
