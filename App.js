import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import FeedScreen from './screens/FeedScreen';
import CommunityScreen from './screens/CommunityScreen';
import ChatScreen from './screens/ChatScreen';
import GuideScreen from './screens/GuideScreen';

function FeedScreenWrapper({ navigation, route }) {
  return <FeedScreen onOpenComments={(post) => console.log('Open comments:', post)} />;
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

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
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
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}