import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatching } from '../contexts/MatchingContext';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

// Option keys — displayed via t() so they translate with the language.
const GENDERS = ['women', 'men', 'everyone'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45+', 'any'];
const INTERESTS = [
  'renting',
  'jobHunting',
  'venting',
  'casualChat',
  'foodDining',
  'languageExchange',
  'events',
  'visaHelp',
  'buyingSelling',
  'studyTips',
];

const tap = (style = Haptics.ImpactFeedbackStyle.Light) => {
  Haptics.impactAsync(style).catch(() => {});
};

function createStyles(c, f) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingBottom: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: c.headerBorder,
    },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: f.bold,
      fontSize: 17,
      fontWeight: '700',
      color: c.text,
    },
    headerSpacer: { width: 40 },
    scroll: { flex: 1 },
    scrollContent: { padding: 16 },
    heroTitle: {
      fontFamily: f.bold,
      fontSize: 24,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
    },
    heroSubtitle: {
      fontFamily: f.regular,
      fontSize: 14,
      lineHeight: 20,
      color: c.textTertiary,
      marginTop: 6,
      marginBottom: 8,
    },
    section: { marginTop: 24 },
    sectionLabel: {
      fontFamily: f.bold,
      fontSize: 13,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontFamily: f.medium, fontSize: 13, fontWeight: '500', color: c.textSecondary },
    chipTextSelected: { color: '#fff' },
    termsCard: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 14,
      padding: 14,
      marginTop: 28,
    },
    termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: c.primary },
    termsText: {
      flex: 1,
      flexWrap: 'wrap',
      fontFamily: f.regular,
      fontSize: 13,
      lineHeight: 19,
      color: c.textSecondary,
    },
    link: { fontFamily: f.semibold, color: c.primary, fontWeight: '600' },
    safetyNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    safetyText: {
      flex: 1,
      fontFamily: f.regular,
      fontSize: 12,
      lineHeight: 17,
      color: c.textTertiary,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.bg,
      borderTopWidth: 0.5,
      borderTopColor: c.headerBorder,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    hint: {
      fontFamily: f.medium,
      fontSize: 12,
      color: c.muted,
      textAlign: 'center',
      marginBottom: 8,
    },
    ctaButton: {
      height: 50,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaButtonDisabled: { opacity: 0.4 },
    ctaButtonText: { fontFamily: f.semibold, fontSize: 15, color: '#fff', fontWeight: '600' },
  });
}

export default function FindFriendsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { startMatching } = useMatching();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  const [gender, setGender] = useState(null);
  const [ageRange, setAgeRange] = useState(null);
  const [interests, setInterests] = useState([]);
  const [agreed, setAgreed] = useState(false);

  const selectGender = useCallback((g) => { tap(); setGender(g); }, []);
  const selectAge = useCallback((a) => { tap(); setAgeRange(a); }, []);
  const toggleInterest = useCallback((key) => {
    tap();
    setInterests((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));
  }, []);
  const toggleAgree = useCallback(() => {
    tap(Haptics.ImpactFeedbackStyle.Medium);
    setAgreed((v) => !v);
  }, []);

  const openLink = (url) => Linking.openURL(url).catch(() => {});

  const canStart = !!gender && !!ageRange && interests.length > 0 && agreed;

  const handleStart = useCallback(() => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    startMatching();
    navigation.replace('Matching');
  }, [canStart, startMatching, navigation]);

  const renderChip = (label, selected, onPress) => (
    <TouchableOpacity
      key={label}
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  const hintKey = !agreed
    ? 'hintTerms'
    : !gender || !ageRange
      ? 'hintBasics'
      : interests.length === 0
        ? 'hintInterest'
        : 'hintReady';

  return (
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
        <Text style={styles.headerTitle} numberOfLines={1}>{t('findFriends.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heroTitle}>{t('findFriends.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('findFriends.heroSubtitle')}</Text>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('findFriends.showMe')}</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => renderChip(t(`findFriends.genders.${g}`), gender === g, () => selectGender(g)))}
          </View>
        </View>

        {/* Age range */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('findFriends.ageRange')}</Text>
          <View style={styles.chipRow}>
            {AGE_RANGES.map((a) => renderChip(t(`findFriends.ages.${a}`), ageRange === a, () => selectAge(a)))}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('findFriends.interestedIn')}</Text>
          <View style={styles.chipRow}>
            {INTERESTS.map((key) =>
              renderChip(t(`findFriends.interests.${key}`), interests.includes(key), () => toggleInterest(key))
            )}
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsCard}>
          <TouchableOpacity style={styles.termsRow} onPress={toggleAgree} activeOpacity={0.7}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              {t('findFriends.termsAgree', {
                guidelines: t('findFriends.communityGuidelines'),
                terms: t('findFriends.termsOfService'),
              })}
            </Text>
          </TouchableOpacity>
          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.primary} />
            <Text style={styles.safetyText}>{t('findFriends.safetyNote')}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={styles.hint}>{t(`findFriends.${hintKey}`)}</Text>
        <TouchableOpacity
          style={[styles.ctaButton, !canStart && styles.ctaButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>{t('findFriends.startMatching')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
