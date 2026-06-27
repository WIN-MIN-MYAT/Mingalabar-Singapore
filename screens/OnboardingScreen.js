import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to Mingalabar SG',
    description: 'Your community platform for sharing ideas, news, and connecting with others.',
    icon: 'people-outline',
    color: '#007AFF',
  },
  {
    id: '2',
    title: 'Discover Content',
    description: 'Explore curated posts, articles, and discussions tailored to your interests.',
    icon: 'compass-outline',
    color: '#34C759',
  },
  {
    id: '3',
    title: 'Engage & Vote',
    description: 'Upvote content you love, downvote what you don\'t, and join the conversation.',
    icon: 'thumbs-up-outline',
    color: '#FF9500',
  },
  {
    id: '4',
    title: 'Connect with Community',
    description: 'Comment, discuss, and build meaningful connections with like-minded people.',
    icon: 'chatbubbles-outline',
    color: '#AF52DE',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const renderSlide = ({ item, index }) => (
    <View style={[styles.slide, { width, height }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={100} color={item.color} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const renderIndicator = (index) => {
    const isActive = index === currentIndex;
    return (
      <View
        key={index}
        style={[
          styles.indicator,
          { marginRight: index < SLIDES.length - 1 ? 8 : 0 },
          isActive && { backgroundColor: SLIDES[currentIndex].color, width: 24 },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 16 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 20 }]}>
        {/* Indicators */}
        <View style={styles.indicatorsContainer}>
          {SLIDES.map((_, index) => renderIndicator(index))}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: SLIDES[currentIndex].color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentIndex < SLIDES.length - 1 && (
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.nextIcon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  nextIcon: {
    marginLeft: 8,
  },
});