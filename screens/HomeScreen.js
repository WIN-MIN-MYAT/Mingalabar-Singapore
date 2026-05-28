import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { storageService } from '../services/storageService';

export default function HomeScreen({ navigation }) {
  const { logout, user, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const handleResetOnboarding = async () => {
    await storageService.clearOnboarding();
    handleLogout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      {profile && <Text style={styles.subtitle}>Hello, {profile.username}</Text>}

      <TouchableOpacity style={styles.devButton} onPress={handleLogout}>
        <Text style={styles.devButtonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.devButton, styles.resetButton]} onPress={handleResetOnboarding}>
        <Text style={styles.devButtonText}>Reset Onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  devButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00288e',
    borderRadius: 8,
  },
  resetButton: {
    backgroundColor: '#ba1a1a',
  },
  devButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
