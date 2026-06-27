import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const iconMap = {
  Home: { outline: 'home-outline', filled: 'home' },
  Feed: { outline: 'list-outline', filled: 'list' },
  Community: { outline: 'people-outline', filled: 'people' },
  Chat: { outline: 'chatbubbles-outline', filled: 'chatbubbles' },
  Guide: { outline: 'book-outline', filled: 'book' },
};

const springConfig = {
  damping: 30,
  stiffness: 250,
  mass: 0.8,
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const tabLayouts = useRef([]);
  const [measured, setMeasured] = useState(false);
  const translateX = useSharedValue(0);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    const layout = tabLayouts.current[state.index];
    if (layout && measured) {
      const w = layout.width * 0.75;
      translateX.value = withSpring(layout.x + (layout.width - w) / 2, springConfig);
      lineWidth.value = withSpring(w, springConfig);
    }
  }, [state.index, measured]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: lineWidth.value,
  }));

  // Hide the tab bar on full-screen nested routes (e.g. the Conversation
  // screen pushed inside the Chat stack) so it doesn't overlap their content.
  // Must run AFTER all hooks to keep the hook count consistent.
  const FULLSCREEN_ROUTES = ['Conversation', 'FindFriends', 'Matching'];
  const focusedTab = state.routes[state.index];
  const nested = focusedTab?.state;
  const focusedNestedName = nested?.routes?.[nested?.index]?.name;
  if (focusedNestedName && FULLSCREEN_ROUTES.includes(focusedNestedName)) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom || 34,
          backgroundColor: Platform.select({ ios: colors.bg + 'E6', android: colors.bg }),
        },
      ]}
    >
      {measured && (
        <Animated.View style={[styles.line, lineStyle, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const icons = iconMap[route.name] || iconMap.Home;
          const iconName = isFocused ? icons.filled : icons.outline;
          const color = isFocused ? colors.primary : colors.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(e) => {
                tabLayouts.current[index] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                };
                if (!measured && tabLayouts.current.filter(Boolean).length === state.routes.length) {
                  const l = tabLayouts.current[state.index];
                  const w = l.width * 0.75;
                  translateX.value = l.x + (l.width - w) / 2;
                  lineWidth.value = w;
                  setMeasured(true);
                }
              }}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons name={iconName} size={24} color={color} />
              <Text style={[styles.label, { color, opacity: isFocused ? 1 : 0.75 }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
      },
      android: {
        elevation: 8,
      },
    }),
  },
  line: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
