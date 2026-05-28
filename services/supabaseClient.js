import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra;
const supabaseUrl = extra?.supabaseUrl || extra?.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = extra?.supabaseAnonKey || extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  platform: Platform.OS
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration!');
}

const supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabaseClient;