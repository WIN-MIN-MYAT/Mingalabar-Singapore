import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'my', label: 'မြန်မာ' },
];

const THEMES = [
  { id: 'light', icon: 'sunny-outline' },
  { id: 'dark', icon: 'moon-outline' },
  { id: 'system', icon: 'phone-portrait-outline' },
];

function createStyles(c, f) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
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
    section: { marginTop: 24 },
    sectionLabel: {
      fontFamily: f.semibold,
      fontSize: 13,
      color: c.textTertiary,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    segmented: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
    segBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    segBtnActive: { borderColor: c.primary, backgroundColor: c.primary },
    segText: { fontFamily: f.semibold, fontSize: 13, color: c.text },
    segTextActive: { color: '#fff' },
    card: {
      backgroundColor: c.surface,
      marginHorizontal: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: 50 },
    rowIconWrap: { width: 28, alignItems: 'center' },
    rowText: { flex: 1, fontFamily: f.medium, fontSize: 15, color: c.text },
    check: { width: 24, alignItems: 'center' },
    footerNote: {
      fontFamily: f.regular,
      fontSize: 12,
      color: c.textTertiary,
      paddingHorizontal: 16,
      marginTop: 12,
    },
  });
}

export default function SettingsScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const { t, locale, setLocale, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
          <View style={styles.segmented}>
            {THEMES.map((th) => {
              const active = mode === th.id;
              return (
                <TouchableOpacity
                  key={th.id}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                  onPress={() => setMode(th.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={th.icon} size={16} color={active ? '#fff' : colors.text} />
                  <Text style={[styles.segText, active && styles.segTextActive]}>{t(`settings.theme.${th.id}`)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.footerNote}>{t('settings.appearanceDesc')}</Text>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
          <View style={styles.card}>
            {LANGUAGES.map((lng, i) => {
              const active = locale === lng.code;
              return (
                <View key={lng.code}>
                  <TouchableOpacity style={styles.row} onPress={() => setLocale(lng.code)} activeOpacity={0.6}>
                    <View style={styles.rowIconWrap}>
                      <Ionicons name="language-outline" size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.rowText}>{lng.label}</Text>
                    {active && (
                      <View style={styles.check}>
                        <Ionicons name="checkmark" size={20} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                  {i < LANGUAGES.length - 1 && <View style={styles.rowDivider} />}
                </View>
              );
            })}
          </View>
          <Text style={styles.footerNote}>{t('settings.languageDesc')}</Text>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('settings.account')}</Text>
          <TouchableOpacity style={[styles.card, styles.row]} activeOpacity={0.6}>
            <View style={styles.rowIconWrap}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            </View>
            <Text style={styles.rowText}>{t('settings.accountDesc')}</Text>
            <View style={styles.check}>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
