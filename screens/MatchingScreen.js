import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import Avatar from '../components/Avatar';
import { useMatching } from '../contexts/MatchingContext';

const PRIMARY = '#00288e';

const RING_BASE = 90;
const DURATION = 2600;

// One expanding radar ring (scale + fade out, looping).
function RadarRing({ delay }) {
  const scale = useSharedValue(0.15);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withRepeat(
      withDelay(delay, withTiming(1, { duration: DURATION, easing: Easing.out(Easing.ease) })),
      -1
    );
    opacity.value = withRepeat(
      withDelay(delay, withTiming(0, { duration: DURATION })),
      -1
    );
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          width: RING_BASE,
          height: RING_BASE,
          borderRadius: RING_BASE / 2,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.9)',
        },
        style,
      ]}
    />
  );
}

function CenterDot() {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(withTiming(1.12, { duration: 900 }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Reanimated.View style={[styles.centerDot, style]}>
      <Ionicons name="people" size={26} color={PRIMARY} />
    </Reanimated.View>
  );
}

function Radar() {
  return (
    <View style={styles.radarBox}>
      <RadarRing delay={0} />
      <RadarRing delay={850} />
      <RadarRing delay={1700} />
      <CenterDot />
    </View>
  );
}

export default function MatchingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { status, match, reset, keepSearching } = useMatching();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const handleSayHi = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const chat = match;
    reset();
    navigation.navigate('Conversation', { chat });
  };

  if (!fontsLoaded) return null;

  const searching = status === 'searching';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {searching ? (
          <>
            <Radar />
            <Text style={styles.title}>Finding people near you…</Text>
            <Text style={styles.subtitle}>
              We’re looking for someone who matches your preferences.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.matchBadgeWrap}>
              <Avatar name={match?.name} avatar={match?.avatar} size={96} />
              <View style={styles.matchSpark}>
                <Ionicons name="sparkles" size={20} color={PRIMARY} />
              </View>
            </View>
            <Text style={styles.title}>It’s a match!</Text>
            <Text style={styles.matchName}>{match?.name}</Text>
            <Text style={styles.subtitle}>{match?.reason}</Text>
          </>
        )}
      </View>

      {/* Bottom actions */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {searching ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              reset();
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.matchActions}>
            <TouchableOpacity
              style={styles.keepBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                keepSearching();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.keepText}>Keep searching</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.hiBtn} onPress={handleSayHi} activeOpacity={0.85}>
              <Ionicons name="chatbubble-outline" size={18} color={PRIMARY} />
              <Text style={styles.hiText}>Say hi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  radarBox: {
    width: RING_BASE,
    height: RING_BASE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  centerDot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  matchName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  matchBadgeWrap: {
    marginBottom: 24,
  },
  matchSpark: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: 20,
  },
  cancelBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  keepBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  hiBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hiText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: PRIMARY,
    fontWeight: '600',
  },
});
