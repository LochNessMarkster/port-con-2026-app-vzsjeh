
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/utils/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { signInWithEmail, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');

  // Check if system needs initial setup
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setCheckingSetup(true);
      console.log('[Admin] Checking setup status...');
      const status = await apiGet<{ needsSetup: boolean; userCount: number; message: string }>('/api/admin/setup/status');
      console.log('[Admin] Setup status:', status);
      setNeedsSetup(status.needsSetup);
      setSetupMessage(status.message || '');
    } catch (err) {
      console.error('[Admin] Failed to check setup status:', err);
      // If endpoint fails, assume normal login flow
      setNeedsSetup(false);
    } finally {
      setCheckingSetup(false);
    }
  };

  const handleLogin = async () => {
    try {
      setError('');
      console.log('[Admin] Attempting login with email:', email);
      await signInWithEmail(email, password);
      console.log('[Admin] Login successful, redirecting to dashboard');
      router.replace('/admin/dashboard' as any);
    } catch (err) {
      console.error('[Admin] Login error:', err);
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    }
  };

  const handleCreateAdmin = async () => {
    try {
      setError('');
      
      if (!name || !email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      console.log('[Admin] Creating first admin user...');
      const result = await apiPost<{ success: boolean; message: string; user: any }>('/api/admin/setup/create-admin', {
        email,
        password,
        name,
      });
      
      console.log('[Admin] Admin user created:', result);
      
      // Now sign in with the new credentials
      await signInWithEmail(email, password);
      console.log('[Admin] Login successful, redirecting to dashboard');
      router.replace('/admin/dashboard' as any);
    } catch (err) {
      console.error('[Admin] Failed to create admin:', err);
      setError(err instanceof Error ? err.message : 'Failed to create admin account');
    }
  };

  const handleSubmit = () => {
    if (needsSetup) {
      handleCreateAdmin();
    } else {
      handleLogin();
    }
  };

  if (Platform.OS !== 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mobileWarning}>
          <IconSymbol
            ios_icon_name="info"
            android_material_icon_name="info"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.mobileWarningTitle}>Admin Panel</Text>
          <Text style={styles.mobileWarningText}>
            The admin panel is only available on web. Please access this page from a desktop browser.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while checking setup status
  if (checkingSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Checking system status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginBox}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {needsSetup ? 'Initial Setup' : 'Admin Panel'}
            </Text>
            <Text style={styles.subtitle}>Port of the Future Conference 2026</Text>
          </View>

          {needsSetup && setupMessage && (
            <View style={styles.infoBox}>
              <IconSymbol
                ios_icon_name="info"
                android_material_icon_name="info"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.infoText}>{setupMessage}</Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {needsSetup && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder={needsSetup ? "At least 8 characters" : "Enter your password"}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, authLoading && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={authLoading}
            >
              <Text style={styles.loginButtonText}>
                {authLoading 
                  ? (needsSetup ? 'Creating Admin Account...' : 'Signing in...') 
                  : (needsSetup ? 'Create Admin Account' : 'Sign In')
                }
              </Text>
            </TouchableOpacity>

            {!needsSetup && (
              <View style={styles.helpText}>
                <Text style={styles.helpTextContent}>
                  If you forgot your password or need help, please contact the system administrator.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.backToAppButton}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <IconSymbol
              ios_icon_name="arrow-back"
              android_material_icon_name="arrow-back"
              size={16}
              color={colors.secondary}
            />
            <Text style={styles.backToAppText}>Back to Conference App</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loginBox: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpText: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  helpTextContent: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  backToAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  backToAppText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  mobileWarning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  mobileWarningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  mobileWarningText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
