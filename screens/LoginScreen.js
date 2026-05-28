import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn, ZoomOut, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import MaskedView from '@react-native-masked-view/masked-view';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import OnboardingSvg from '../assets/svg/Onboarding-cuate.svg';
// <a href="https://storyset.com/technology">Technology illustrations by Storyset</a>
import MobileLoginSvg from '../assets/svg/Mobile login-amico.svg';
// <a href="https://storyset.com/people">People illustrations by Storyset</a>
import SignUpSvg from '../assets/svg/Welcome-cuate.svg';

function InputField({ icon, placeholder, value, onChangeText, secureTextEntry, error, autoComplete, keyboardType, autoCapitalize }) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = secureTextEntry !== undefined;

  return (
    <View style={styles.inputGroup}>
      <View style={[
        styles.inputContainer,
        focused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        <Ionicons name={icon} size={20} color={focused ? '#00288e' : '#444653'} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#757684"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          autoComplete={autoComplete}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#757684" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function GradientText({ text, style }) {
  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: 'transparent' }]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={['#00288e', '#0058be']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export default function LoginScreen({ onLoginSuccess, onSignupComplete, onBack }) {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleForgotPassword = () => {
    // TODO: implement forgot password flow
  };

  const openLink = async (url) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Please enter a valid email';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';

    if (!isLogin) {
      if (!username) newErrors.username = 'Username is required';
      else if (username.length < 3)
        newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        onLoginSuccess();
      } else {
        await register(email, password, username);
        if (onSignupComplete) {
          onSignupComplete();
        } else {
          Alert.alert('Success', 'Account created successfully!', [
            { text: 'OK', onPress: onLoginSuccess }
          ]);
        }
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Floating animation
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  if (!fontsLoaded) return null;

  const SvgComponent = isLogin ? OnboardingSvg : SignUpSvg;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 24,
              paddingBottom: Platform.OS === 'android' && keyboardVisible ? keyboardHeight : 0
            }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
          bounces={false}
        >
          {/* Illustration */}
          <Animated.View
            key={isLogin ? 'login-svg' : 'signup-svg'}
            entering={ZoomIn.duration(400)}
            exiting={ZoomOut.duration(300)}
            style={styles.illustrationContainer}
          >
            <Animated.View style={[styles.illustrationInner, floatStyle]}>
              <SvgComponent
                width="100%"
                height={180}
              />
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <GradientText
              text={isLogin ? 'Welcome Back' : 'Create Account'}
              style={styles.title}
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              icon="mail-outline"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            {!isLogin && (
              <InputField
                icon="person-outline"
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoComplete="username"
                autoCapitalize="none"
                error={errors.username}
              />
            )}

            <InputField
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              error={errors.password}
            />

            {/* Forgot Password */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Switch Auth Mode */}
            <TouchableOpacity style={styles.switchContainer} onPress={() => {
              setIsLogin(!isLogin);
              setEmail('');
              setPassword('');
              setUsername('');
              setErrors({});
            }}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchTextBold}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Social Login */}
            {isLogin && (
              <View>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <TouchableOpacity style={[styles.socialButton, styles.socialButtonLeft]} activeOpacity={0.8}>
                    <Ionicons name="logo-google" size={20} color="#444653" />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.socialButton, styles.socialButtonRight]} activeOpacity={0.8}>
                    <Ionicons name="logo-apple" size={20} color="#444653" />
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Terms - pinned to bottom */}
        {!keyboardVisible && (
          <View style={[styles.termsBar, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink} onPress={() => openLink('https://example.com/terms')}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink} onPress={() => openLink('https://example.com/privacy')}>Privacy Policy</Text>
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  illustrationInner: {
    width: '100%',
    alignItems: 'center',
  },
  titleContainer: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.02,
    lineHeight: 36,
  },
  form: {
    marginTop: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -8,
    marginBottom: 12,
  },
  forgotPasswordText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#0058be',
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: 0.01,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c4c5d5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#eceef0',
  },
  inputFocused: {
    borderColor: '#00288e',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#ba1a1a',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#191c1e',
    lineHeight: 20,
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#ba1a1a',
    marginLeft: 16,
    marginTop: 4,
    lineHeight: 14,
  },
  button: {
    marginTop: 16,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#00288e',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.01,
  },
  switchContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  switchText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#444653',
    lineHeight: 20,
  },
  switchTextBold: {
    fontFamily: 'Inter_600SemiBold',
    color: '#0058be',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e3e5',
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    marginHorizontal: 16,
    fontSize: 12,
    color: '#757684',
    lineHeight: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    borderRadius: 12,
    backgroundColor: '#f2f4f6',
  },
  socialButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
    marginLeft: 8,
    lineHeight: 16,
    letterSpacing: 0.01,
  },
  socialButtonLeft: {
    marginRight: 12,
  },
  socialButtonRight: {
    marginLeft: 12,
  },
  termsBar: {
    paddingHorizontal: 32,
    paddingTop: 12,
    backgroundColor: '#f7f9fb',
  },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: '#757684',
    textAlign: 'center',
    lineHeight: 14,
  },
  termsLink: {
    fontFamily: 'Inter_500Medium',
    color: '#0058be',
  },
});
