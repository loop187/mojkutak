import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { apiErrorMessage } from '../services/api';
import { register } from '../services/auth';
import { registerForPushNotifications } from '../services/push';
import { useAuthStore } from '../store/useAuthStore';

interface Props {
  role: 'owner' | 'user';
  title: string;
  subtitle: string;
  nazivLabel: string;
}

export default function RegisterForm({ role, title, subtitle, nazivLabel }: Props) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [naziv, setNaziv] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!naziv.trim() || !username.trim() || !email.trim() || !password) {
      setError('Ispunite sva obavezna polja');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Lozinke se ne podudaraju');
      return;
    }
    if (password.length < 6) {
      setError('Lozinka mora imati barem 6 znakova');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        naziv: naziv.trim(),
        mobile_number: phone.trim() || undefined,
      });
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <TextInput
          style={styles.input}
          placeholder={nazivLabel + ' *'}
          placeholderTextColor={COLORS.textSecondary}
          value={naziv}
          onChangeText={setNaziv}
        />
        <TextInput
          style={styles.input}
          placeholder="Korisničko ime *"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email *"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Telefon"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Lozinka *"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Ponovi lozinku *"
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Registriraj se</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Natrag na prijavu</Text>
        </TouchableOpacity>
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
    gap: SPACING.sm,
  },
  title: { fontSize: FONT.title, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: FONT.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
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
  backLink: { textAlign: 'center', color: COLORS.primary, marginTop: SPACING.md, fontWeight: '600' },
});
