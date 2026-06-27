import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

const tel = (n) => Linking.openURL(`tel:${n}`).catch(() => {});
const web = (u) => Linking.openURL(u).catch(() => {});

function createStyles(c, f) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 8,
    },
    headerTitle: {
      fontFamily: f.bold,
      fontSize: 30,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.8,
      lineHeight: 36,
      marginTop: 8,
    },
    intro: {
      fontFamily: f.regular,
      fontSize: 15,
      lineHeight: 21,
      color: c.textTertiary,
      marginTop: 6,
    },
    content: { padding: 20, paddingBottom: 36 },
    sectionTitle: {
      fontFamily: f.semibold,
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
      marginBottom: 12,
      marginTop: 26,
    },
    // Featured emergency
    featured: {
      backgroundColor: c.isDark ? 'rgba(186,26,26,0.16)' : 'rgba(186,26,26,0.07)',
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(186,26,26,0.25)',
    },
    featuredHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    featuredTitle: { fontFamily: f.bold, fontSize: 16, fontWeight: '700', color: c.error },
    featuredRow: { flexDirection: 'row', gap: 12 },
    bigCall: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: c.error,
    },
    bigCallOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: c.error,
    },
    bigCallText: { fontFamily: f.semibold, fontSize: 14, color: '#fff', fontWeight: '600' },
    bigCallTextOutline: { color: c.error },
    bigCallSub: { fontFamily: f.regular, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
    // Contact card
    contact: {
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
    },
    contactHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    contactTitle: { flex: 1, fontFamily: f.semibold, fontSize: 16, fontWeight: '600', color: c.text },
    detail: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 7 },
    detailIcon: { width: 16, alignItems: 'center', marginTop: 2 },
    detailText: { flex: 1, fontFamily: f.regular, fontSize: 13, lineHeight: 19, color: c.textSecondary },
    actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.primary },
    actionText: { fontFamily: f.semibold, fontSize: 13, color: '#fff', fontWeight: '600' },
    actionTextOutline: { color: c.primary },
    // Living rows (minimal, expandable)
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 15,
    },
    rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    rowTitle: { flex: 1, fontFamily: f.medium, fontSize: 15, color: c.text, fontWeight: '500' },
    rowBody: { paddingBottom: 14 },
    rowText: { fontFamily: f.regular, fontSize: 13, lineHeight: 20, color: c.textSecondary },
    listCard: {
      backgroundColor: c.surface,
      borderRadius: 18,
      paddingHorizontal: 18,
      marginBottom: 12,
      overflow: 'hidden',
    },
  });
}

function ActionBtn({ icon, label, onPress, outline, styles, colors }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, outline && styles.actionBtnOutline]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={15} color={outline ? colors.primary : '#fff'} />
      <Text style={[styles.actionText, outline && styles.actionTextOutline]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function GuideScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t, font } = useI18n();
  const styles = useMemo(() => createStyles(colors, font), [colors, font]);
  const [openRow, setOpenRow] = useState(null);

  const living = [
    {
      id: 'work',
      icon: 'briefcase-outline',
      title: 'Working in Singapore',
      text: 'Work passes (Employment Pass, S Pass, Work Permit) are issued by the Ministry of Manpower. Carry a copy of your pass and verify it on the MOM SGWorkPass app.',
      link: { label: 'MOM Website', url: 'https://www.mom.gov.sg' },
    },
    {
      id: 'transport',
      icon: 'subway-outline',
      title: 'Getting Around',
      text: 'Tap an EZ-Link / SimplyGo card on buses and MRT. Use Google Maps or Citymapper for routes; Grab and Gojek for rides.',
    },
    {
      id: 'remittance',
      icon: 'cash-outline',
      title: 'Sending Money Home',
      text: 'Use licensed remittance services around Peninsula Plaza & Golden Mile. Keep your receipt and compare rates before sending.',
    },
    {
      id: 'community',
      icon: 'map-outline',
      title: 'Burmese Community Spots',
      text: 'Golden Mile Complex, Peninsula Plaza & Lucky Plaza have Burmese groceries, food and services.',
      toCommunity: true,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>{t('guide.title')}</Text>
        <Text style={styles.intro}>{t('guide.intro')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Featured emergency */}
        <View style={styles.featured}>
          <View style={styles.featuredHead}>
            <Ionicons name="warning" size={18} color={colors.error} />
            <Text style={styles.featuredTitle}>Emergency</Text>
          </View>
          <View style={styles.featuredRow}>
            <TouchableOpacity style={styles.bigCall} activeOpacity={0.85} onPress={() => tel('999')}>
              <Ionicons name="shield" size={16} color="#fff" />
              <Text style={styles.bigCallText}>Police · 999</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigCall, styles.bigCallOutline]}
              activeOpacity={0.85}
              onPress={() => tel('995')}
            >
              <Ionicons name="flame" size={16} color={colors.error} />
              <Text style={[styles.bigCallText, styles.bigCallTextOutline]}>Ambulance · 995</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contacts */}
        <Text style={styles.sectionTitle}>Contacts</Text>

        <View style={styles.contact}>
          <View style={styles.contactHead}>
            <Ionicons name="flag" size={20} color={colors.primary} />
            <Text style={styles.contactTitle}>Myanmar Embassy</Text>
          </View>
          <View style={styles.detail}>
            <View style={styles.detailIcon}><Ionicons name="location-outline" size={14} color={colors.textTertiary} /></View>
            <Text style={styles.detailText}>15 St Martin's Drive, Singapore 257996</Text>
          </View>
          <View style={styles.detail}>
            <View style={styles.detailIcon}><Ionicons name="call-outline" size={14} color={colors.textTertiary} /></View>
            <Text style={styles.detailText}>+65 6735 0209 · Mon–Fri, 9am–5pm</Text>
          </View>
          <View style={styles.actions}>
            <ActionBtn icon="call" label="Call" onPress={() => tel('+6567350209')} styles={styles} colors={colors} />
            <ActionBtn icon="open-outline" label="Website" outline onPress={() => web('https://www.myanmarembassy.sg')} styles={styles} colors={colors} />
          </View>
        </View>

        <View style={styles.contact}>
          <View style={styles.contactHead}>
            <Ionicons name="moon" size={20} color="#FFB800" />
            <Text style={styles.contactTitle}>Burmese Buddhist Temple</Text>
          </View>
          <View style={styles.detail}>
            <View style={styles.detailIcon}><Ionicons name="location-outline" size={14} color={colors.textTertiary} /></View>
            <Text style={styles.detailText}>14 Tai Gin Road, Singapore 327873 (Novena)</Text>
          </View>
          <View style={styles.detail}>
            <View style={styles.detailIcon}><Ionicons name="call-outline" size={14} color={colors.textTertiary} /></View>
            <Text style={styles.detailText}>+65 6251 1717 · Daily, 9am–6pm</Text>
          </View>
          <View style={styles.actions}>
            <ActionBtn icon="call" label="Call" onPress={() => tel('+6562511717')} styles={styles} colors={colors} />
            <ActionBtn icon="open-outline" label="Website" outline onPress={() => web('https://www.bbt.org.sg')} styles={styles} colors={colors} />
          </View>
        </View>

        {/* Living in Singapore — minimal expandable rows */}
        <Text style={styles.sectionTitle}>Living in Singapore</Text>
        <View style={styles.listCard}>
          {living.map((r, i) => {
            const open = openRow === r.id;
            return (
              <View key={r.id}>
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => setOpenRow(open ? null : r.id)}
                >
                  <Ionicons name={r.icon} size={20} color={colors.textTertiary} />
                  <Text style={styles.rowTitle}>{r.title}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                {open && (
                  <View style={styles.rowBody}>
                    <Text style={styles.rowText}>{r.text}</Text>
                    <View style={styles.actions}>
                      {r.toCommunity ? (
                        <ActionBtn icon="map" label="Open Map" onPress={() => navigation.navigate('Community')} styles={styles} colors={colors} />
                      ) : r.link ? (
                        <ActionBtn icon="open-outline" label={r.link.label} outline onPress={() => web(r.link.url)} styles={styles} colors={colors} />
                      ) : null}
                    </View>
                  </View>
                )}
                {i < living.length - 1 && <View style={styles.rowDivider} />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
