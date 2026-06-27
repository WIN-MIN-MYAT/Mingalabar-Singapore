import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

import AvGirl1 from '../assets/avatar/av_girl1.svg';
import AvGirl2 from '../assets/avatar/av_girl2.svg';
import AvGirl3 from '../assets/avatar/av_girl3.svg';
import AvGirl4 from '../assets/avatar/av_girl4.svg';
import AvBoy1 from '../assets/avatar/av_boy1.svg';
import AvBoy2 from '../assets/avatar/av_boy2.svg';
import AvBoy3 from '../assets/avatar/av_boy3.svg';
import AvBoy4 from '../assets/avatar/av_boy4.svg';

const PRIMARY = '#00288e';

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

/**
 * Renders an avatar from a known SVG key, a URL, or a letter fallback.
 * Shared across chat screens.
 */
export default function Avatar({ name, avatar, size = 50 }) {
  const SvgAvatar = avatar && AVATAR_MAP[avatar];
  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'));
  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {SvgAvatar ? (
        <SvgAvatar width={size} height={size} />
      ) : isUrl ? (
        <Image source={{ uri: avatar }} style={{ width: size, height: size }} />
      ) : (
        <Text style={[styles.fallback, { fontSize: size * 0.38 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: PRIMARY,
  },
  fallback: {
    fontFamily: 'Inter_700Bold',
    color: '#444653',
    fontWeight: '700',
  },
});
