import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import HomeScreen from './screens/HomeScreen';
import FeedScreen from './screens/FeedScreen';
import CommunityScreen from './screens/CommunityScreen';
import ChatScreen from './screens/ChatScreen';
import GuideScreen from './screens/GuideScreen';
import LoginScreen from './screens/LoginScreen';
import AvatarScreen from './screens/AvatarScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SplashScreen from './screens/SplashScreen';
import AuthProvider, { useAuth } from './contexts/AuthContext';
import { storageService } from './services/storageService';

function FeedScreenWrapper({ navigation, route }) {
  return <FeedScreen />;
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Feed"
        component={FeedScreenWrapper}
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => (
            <Ionicons name="list-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          tabBarLabel: 'Guide',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const Tab = createBottomTabNavigator();

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: '#007AFF',
  tabBarInactiveTintColor: '#8E8E93',
  tabBarStyle: {
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.85)',
      android: '#FFFFFF',
    }),
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    height: 88,
    paddingBottom: 34,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabBarItemStyle: {
    paddingVertical: 4,
  },
};

function AppContent() {
  const { loading: authLoading, isAuthenticated, profile } = useAuth();
  const [onboardingCompleted, setOnboardingCompleted] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // If authenticated but no avatar, force avatar selection
  const needsAvatar = isAuthenticated && profile && !profile.avatar_url;
  useEffect(() => {
    if (needsAvatar) {
      setShowAvatar(true);
    }
  }, [needsAvatar]);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const completed = await storageService.hasCompletedOnboarding();
    setOnboardingCompleted(completed);
    setAppReady(true);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = async () => {
    await storageService.setOnboardingCompleted(true);
    setOnboardingCompleted(true);
  };

  const handleLoginSuccess = () => {
    if (profile && !profile.avatar_url) {
      setShowAvatar(true);
    } else {
      setShowAvatar(false);
    }
  };

  const handleSignupComplete = () => {
    setShowAvatar(true);
  };

  const handleAvatarComplete = () => {
    setShowAvatar(false);
  };

  const handleBackToOnboarding = () => {
    setShowLogin(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!appReady || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!onboardingCompleted) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="dark-content" />
      </>
    );
  }

  if (showLogin) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} onSignupComplete={handleSignupComplete} onBack={handleBackToOnboarding} />
        <StatusBar style="dark-content" />
      </>
    );
  }

  return (
    <>
      {showAvatar ? (
        <AvatarScreen onComplete={handleAvatarComplete} />
      ) : isAuthenticated ? (
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} onSignupComplete={handleSignupComplete} onBack={handleBackToOnboarding} />
      )}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BottomSheetModalProvider>
            <AppContent />
          </BottomSheetModalProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});