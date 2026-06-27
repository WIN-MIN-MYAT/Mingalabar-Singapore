import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';
import SettingsScreen from './SettingsScreen';

const EMBASSY_PHONE = '+6567350209';

function createStyles(c, f) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    wordmark: {
      fontFamily: f.bold,
      fontSize: 17,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: -0.2,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingBottom: 32 },
    // Greeting (typographic focal)
    greeting: {
      fontFamily: f.bold,
      fontSize: 30,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.8,
      lineHeight: 36,
      marginTop: 8,
    },
    greetingSub: {
      fontFamily: f.regular,
      fontSize: 15,
      color: c.textTertiary,
      marginTop: 6,
    },
    // Hero CTA
    hero: {
      backgroundColor: c.primary,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroBody: { flex: 1, paddingRight: 12 },
    heroTitle: {
      fontFamily: f.bold,
      fontSize: 18,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: -0.2,
    },
    heroSub: {
      fontFamily: f.regular,
      fontSize: 13,
      color: 'rgba(255,255,255,0.82)',
      marginTop: 4,
    },
    heroArrow: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Section header (refined — not all-caps)
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontFamily: f.semibold,
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
    sectionLink: {
      fontFamily: f.medium,
      fontSize: 13,
      color: c.primary,
      fontWeight: '500',
    },
    // Explore rail
    rail: { flexDirection: 'row', gap: 12 },
    railCard: {
      width: 132,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 16,
      gap: 16,
    },
    railIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    railLabel: {
      fontFamily: f.semibold,
      fontSize: 14,
      fontWeight: '600',
      color: c.text,
    },
    railHint: {
      fontFamily: f.regular,
      fontSize: 11,
      color: c.textTertiary,
      marginTop: 2,
    },
    // Quiet help row
    helpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 28,
      paddingVertical: 6,
    },
    helpIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpText: { flex: 1 },
    helpTitle: { fontFamily: f.medium, fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    helpSub: { fontFamily: f.regular, fontSize: 12, color: c.textTertiary, marginTop: 1 },
    block: { marginTop: 28 },
  });
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const { logout, profile } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const name = profile?.username || '';

  const explore = [
    { key: 'feed', icon: 'newspaper-outline', label: t('home.q.feed'), hint: 'News & posts', target: 'Feed', tint: '#FFB800' },
    { key: 'community', icon: 'map-outline', label: t('home.q.community'), hint: 'Map & shops', target: 'Community', tint: '#34c759' },
    { key: 'chat', icon: 'chatbubbles-outline', label: t('home.q.chat'), hint: 'Messages', target: 'Chat', tint: '#4d7cff' },
    { key: 'guide', icon: 'compass-outline', label: t('home.q.guide'), hint: 'Living in SG', target: 'Guide', tint: '#ba1a1a' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.wordmark}>Mingalabar SG</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setSettingsOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>{t('home.greeting', { name })}</Text>
        <Text style={styles.greetingSub}>{t('home.greetingSub')}</Text>

        {/* Hero CTA */}
        <TouchableOpacity
          style={styles.hero}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Chat', { screen: 'FindFriends' })}
        >
          <View style={styles.heroBody}>
            <Text style={styles.heroTitle}>{t('home.cta')}</Text>
            <Text style={styles.heroSub}>{t('home.ctaSub')}</Text>
          </View>
          <View style={styles.heroArrow}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Explore rail */}
        <View style={styles.block}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            <View style={styles.rail}>
              {explore.map((e) => (
                <TouchableOpacity
                  key={e.key}
                  style={styles.railCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(e.target)}
                >
                  <View style={styles.railIcon}>
                    <Ionicons name={e.icon} size={24} color={e.tint} />
                  </View>
                  <View>
                    <Text style={styles.railLabel}>{e.label}</Text>
                    <Text style={styles.railHint}>{e.hint}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Quiet help */}
        <TouchableOpacity
          style={styles.helpRow}
          activeOpacity={0.7}
          onPress={() => Linking.openURL(`tel:${EMBASSY_PHONE}`).catch(() => {})}
        >
          <View style={styles.helpIcon}>
            <Ionicons name="call-outline" size={17} color={colors.primary} />
          </View>
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>{t('home.needHelp')} · Myanmar Embassy</Text>
            <Text style={styles.helpSub}>+65 6735 0209 · tap to call</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={settingsOpen} animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <SettingsScreen onClose={() => setSettingsOpen(false)} />
      </Modal>
    </View>
  );
}
