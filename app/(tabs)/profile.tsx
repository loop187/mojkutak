import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import LicenseExpiredModal from '../../components/LicenseExpiredModal';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { logout, uploadProfilePhoto, validate } from '../../services/auth';
import { getMyWorkplaces, setShift, Workplace } from '../../services/staff';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [licenseModalVisible, setLicenseModalVisible] = useState(false);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);

  const isOwner = user?.role === 'owner';

  useFocusEffect(
    useCallback(() => {
      if (!user || isOwner) return;
      getMyWorkplaces()
        .then(setWorkplaces)
        .catch(() => {});
    }, [user?.id, isOwner])
  );

  if (!user) return null;

  const toggleShift = async (wp: Workplace, value: boolean) => {
    setWorkplaces((prev) =>
      prev.map((w) => (w.venueId === wp.venueId ? { ...w, uSmjeni: value } : w))
    );
    try {
      await setShift(wp.venueId, value);
    } catch (e) {
      setWorkplaces((prev) =>
        prev.map((w) => (w.venueId === wp.venueId ? { ...w, uSmjeni: !value } : w))
      );
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    router.replace('/(auth)/login');
  };

  const handlePhotoPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    try {
      await uploadProfilePhoto(result.assets[0].base64, result.assets[0].mimeType ?? 'image/jpeg');
      const refreshed = await validate();
      if (refreshed) setUser(refreshed);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const licenseLabel = user.licenseUntil
    ? new Date(user.licenseUntil + 'T00:00:00').toLocaleDateString('hr-HR')
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: SPACING.md }}>
      <View style={styles.card}>
        <TouchableOpacity onPress={handlePhotoPick} style={styles.avatarWrap}>
          {user.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>{user.naziv.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.avatarHint}>Promijeni sliku</Text>
        </TouchableOpacity>

        <Text style={styles.name}>{user.naziv}</Text>
        <Text style={styles.role}>{isOwner ? 'Ugostitelj' : 'Gost'}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Korisničko ime</Text>
          <Text style={styles.infoValue}>{user.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        {!!user.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
        )}
      </View>

      {isOwner && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Licenca</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: user.licenseExpired ? COLORS.danger : COLORS.success }]}>
              {user.licenseExpired ? 'Istekla' : 'Aktivna'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vrijedi do</Text>
            <Text style={styles.infoValue}>{licenseLabel}</Text>
          </View>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setLicenseModalVisible(true)}>
            <Text style={styles.btnPrimaryText}>
              {user.licenseExpired ? 'Kupi licencu' : 'Produlji licencu'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isOwner && workplaces.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Moja radna mjesta</Text>
          {workplaces.map((wp) => (
            <View key={wp.venueId} style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoValue}>{wp.venueNaziv}</Text>
                {!!wp.mjesto && <Text style={styles.infoLabel}>{wp.mjesto}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Switch
                  value={wp.uSmjeni}
                  onValueChange={(v) => toggleShift(wp, v)}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor="#fff"
                />
                <Text style={styles.infoLabel}>{wp.uSmjeni ? 'U smjeni' : 'Nije u smjeni'}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>Odjavi se</Text>
      </TouchableOpacity>

      <LicenseExpiredModal
        visible={licenseModalVisible}
        onClose={() => setLicenseModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'stretch',
  },
  avatarWrap: { alignItems: 'center', marginBottom: SPACING.sm },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontSize: 34, fontWeight: '800' },
  avatarHint: { color: COLORS.primary, fontSize: FONT.tiny, marginTop: SPACING.xs },
  name: { fontSize: FONT.title, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  role: { fontSize: FONT.small, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: FONT.body },
  infoValue: { color: COLORS.text, fontSize: FONT.body, fontWeight: '600' },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnLogout: {
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  btnLogoutText: { color: COLORS.danger, fontWeight: '700' },
});
