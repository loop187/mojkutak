import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { login } from '../../services/auth';
import { registerForPushNotifications } from '../../services/push';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Unesite korisničko ime i lozinku');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(username.trim(), password);
      setUser(user);
      registerForPushNotifications();
      router.replace('/(tabs)');
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.logo}>Moj kutak</Text>
        <Text style={styles.tagline}>Pronađi svoj kutak u gradu</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Korisničko ime"
            placeholderTextColor={COLORS.textSecondary}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Lozinka"
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Prijavi se</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.registerSection}>
          <Text style={styles.registerLabel}>Nemaš račun?</Text>
          <TouchableOpacity style={styles.buttonOutline} onPress={() => router.push('/(auth)/register-user')}>
            <Text style={styles.buttonOutlineText}>Registriraj se kao gost</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOutline} onPress={() => router.push('/(auth)/register-owner')}>
            <Text style={styles.buttonOutlineText}>Registriraj se kao ugostitelj</Text>
          </TouchableOpacity>
          <Text style={styles.trialHint}>Ugostitelji dobivaju besplatan probni period od 1 mjesec! 🎉</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  logoImage: { width: 120, height: 120, alignSelf: 'center', marginBottom: SPACING.md },
  logo: { fontSize: 36, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  tagline: { fontSize: FONT.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.xl },
  form: { gap: SPACING.sm },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT.body,
    color: COLORS.text,
  },
  error: { color: COLORS.danger, fontSize: FONT.small },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
  registerSection: { marginTop: SPACING.xl, gap: SPACING.sm },
  registerLabel: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT.small },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  },
  buttonOutlineText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT.body },
  trialHint: { textAlign: 'center', color: COLORS.textSecondary, fontSize: FONT.small, marginTop: SPACING.sm },
});
