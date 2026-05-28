import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import AvGirl1 from '../assets/avatar/av_girl1.svg';
import AvGirl2 from '../assets/avatar/av_girl2.svg';
import AvGirl3 from '../assets/avatar/av_girl3.svg';
import AvGirl4 from '../assets/avatar/av_girl4.svg';
import AvBoy1 from '../assets/avatar/av_boy1.svg';
import AvBoy2 from '../assets/avatar/av_boy2.svg';
import AvBoy3 from '../assets/avatar/av_boy3.svg';
import AvBoy4 from '../assets/avatar/av_boy4.svg';

const { width } = Dimensions.get('window');
const GRID_PADDING = 40;
const GRID_GAP = 16;
const ITEM_SIZE = (width - GRID_PADDING - GRID_GAP * 2) / 3;

const DICEBEAR_BASE = 'https://api.dicebear.com/10.x/notionists/png?noseVariant=variant03,variant13&mouthVariant=variant14,variant17,variant22,variant23,variant25,variant30&hairVariant=hat,variant01,variant02,variant03,variant04,variant05,variant06,variant07,variant08,variant09,variant10,variant11,variant12,variant13,variant15,variant16,variant17,variant18,variant19,variant20,variant21,variant22,variant23,variant24,variant25,variant26,variant27,variant28,variant29,variant30,variant31,variant32,variant33,variant34,variant35,variant36,variant37,variant38,variant39,variant40,variant41,variant42,variant43,variant44,variant45,variant46,variant47,variant48,variant49,variant55,variant56,variant57,variant58,variant59,variant60,variant61,variant62,variant63&glassesVariant=&glassesProbability=0&gestureVariant=&eyesVariant=variant05&eyebrowsVariant=variant06,variant10&clothesGraphicVariant=&clothesVariant=variant11,variant12,variant13,variant14,variant15,variant16,variant19,variant20,variant21,variant22,variant23,variant24,variant25&beardVariant=variant05,variant06,variant07,variant08,variant09,variant10,variant12&seed=';

const PRESET_AVATARS = [
  { id: 'boy1', component: AvBoy1 },
  { id: 'boy2', component: AvBoy2 },
  { id: 'boy3', component: AvBoy3 },
  { id: 'boy4', component: AvBoy4 },
  { id: 'girl1', component: AvGirl1 },
  { id: 'girl2', component: AvGirl2 },
  { id: 'girl3', component: AvGirl3 },
  { id: 'girl4', component: AvGirl4 },
];

function generateRandomSeed() {
  return Math.random().toString(36).substring(2, 10);
}

const AvatarGridItem = memo(function AvatarGridItem({ avatar, isSelected, onSelect }) {
  const SvgComp = avatar.component;
  return (
    <TouchableOpacity
      style={[styles.gridItem, isSelected && styles.gridItemSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.gridCircle, isSelected && styles.gridCircleSelected]}>
        <SvgComp width={ITEM_SIZE} height={ITEM_SIZE} />
      </View>
    </TouchableOpacity>
  );
});

const AvatarPreview = memo(function AvatarPreview({ selectedId, selectedType, randomUrl }) {
  if (!selectedId) {
    return (
      <View style={styles.previewPlaceholder}>
        <Ionicons name="person-outline" size={48} color="#c4c5d5" />
      </View>
    );
  }

  if (selectedType === 'random' && randomUrl) {
    return (
      <Image
        source={{ uri: randomUrl }}
        style={styles.previewImage}
        resizeMode="contain"
      />
    );
  }

  const preset = PRESET_AVATARS.find(a => a.id === selectedId);
  if (preset) {
    const SvgComp = preset.component;
    return <SvgComp width={120} height={120} />;
  }

  return null;
});

export default function AvatarScreen({ onComplete }) {
  const { updateUserProfile, profile, user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'preset' | 'random'
  const [randomUrl, setRandomUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSelectPreset = useCallback((id) => {
    setSelectedId(id);
    setSelectedType('preset');
  }, []);

  const handleRandomize = () => {
    const seed = generateRandomSeed();
    const url = DICEBEAR_BASE + seed;
    setRandomUrl(url);
    setSelectedId('random');
    setSelectedType('random');
  };

  const getAvatarUrl = () => {
    if (selectedType === 'random') return randomUrl;
    return selectedId;
  };

  const handleContinue = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateUserProfile({ avatar_url: getAvatarUrl() });
      onComplete();
    } catch (error) {
      console.error('Failed to save avatar:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.header}>
        <MaskedView
          maskElement={
            <Text style={[styles.title, { backgroundColor: 'transparent' }]}>Choose Your Avatar</Text>
          }
        >
          <LinearGradient colors={['#00288e', '#0058be']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.title, { opacity: 0 }]}>Choose Your Avatar</Text>
          </LinearGradient>
        </MaskedView>
        <Text style={styles.subtitle}>Pick an avatar that represents you</Text>
      </Animated.View>

      {/* Preview */}
      <Animated.View entering={ZoomIn.duration(400).delay(200)} style={styles.previewContainer}>
        <View style={[styles.previewCircle, selectedId && styles.previewCircleSelected]}>
          <AvatarPreview selectedId={selectedId} selectedType={selectedType} randomUrl={randomUrl} />
        </View>
      </Animated.View>

      {/* Grid */}
      <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.grid}>
        {PRESET_AVATARS.map((avatar) => (
          <AvatarGridItem
            key={avatar.id}
            avatar={avatar}
            isSelected={selectedId === avatar.id}
            onSelect={() => handleSelectPreset(avatar.id)}
          />
        ))}

        {/* Randomize button */}
        <TouchableOpacity
          style={[styles.gridItem, selectedId === 'random' && styles.gridItemSelected]}
          onPress={handleRandomize}
          activeOpacity={0.7}
        >
          <View style={[styles.gridCircle, selectedId === 'random' && styles.gridCircleSelected]}>
            <Ionicons name="shuffle" size={32} color="#00288e" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={FadeInDown.duration(400).delay(500)} style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!selectedId || saving) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedId || saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.01,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#444653',
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  previewCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  previewCircleSelected: {
    borderColor: '#191c1e',
    borderWidth: 4,
    backgroundColor: '#ffffff',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: 114,
    height: 114,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gridItem: {
    width: ITEM_SIZE,
    alignItems: 'center',
    marginBottom: 16,
  },
  gridItemSelected: {},
  gridCircle: {
    width: ITEM_SIZE - 8,
    height: ITEM_SIZE - 8,
    borderRadius: (ITEM_SIZE - 8) / 2,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c4c5d5',
    overflow: 'hidden',
  },
  gridCircleSelected: {
    borderColor: '#0058be',
    borderWidth: 3,
    backgroundColor: '#ffffff',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  button: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#00288e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.01,
  },
});
