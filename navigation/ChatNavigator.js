import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatScreen from '../screens/ChatScreen';
import ConversationScreen from '../screens/ConversationScreen';
import FindFriendsScreen from '../screens/FindFriendsScreen';
import MatchingScreen from '../screens/MatchingScreen';

const Stack = createNativeStackNavigator();

// Lets the conversation, find-friends, and matching screens push as real
// screens (with native back gesture/animation) instead of slide-up modals.
// Custom headers are used, so the navigator header is hidden. The shared
// matching state (MatchingProvider) lives at the app root in App.js.
export default function ChatNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="FindFriends" component={FindFriendsScreen} />
      <Stack.Screen name="Matching" component={MatchingScreen} />
    </Stack.Navigator>
  );
}
