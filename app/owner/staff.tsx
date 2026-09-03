import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { addVenueStaff, getVenueStaff, removeVenueStaff, StaffMember } from '../../services/staff';

export default function VenueStaffScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    try {
      const data = await getVenueStaff(venueId);
      setStaff(data);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [venueId]);

  const handleAdd = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      Alert.alert('Unesite email radnika');
      return;
    }
    setAdding(true);
    try {
      await addVenueStaff(venueId, trimmed);
      setEmail('');
      await load();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (member: StaffMember) => {
    Alert.alert('Ukloni radnika', `Ukloniti radnika ${member.naziv}?`, [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Da, ukloni',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeVenueStaff(venueId, member.userId);
            await load();
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <View
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: SPACING.md,
                paddingBottom: SPACING.sm,
                backgroundColor: COLORS.card,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.border,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
                <Text style={{ fontSize: 24, color: COLORS.primary }}>←</Text>
              </TouchableOpacity>
              <Text
                style={{
                  marginLeft: SPACING.sm,
                  fontSize: FONT.subtitle,
                  fontWeight: '700',
                  color: COLORS.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                Radnici
              </Text>
            </View>
          ),
        }}
      />
      <FlatList
        data={staff}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ padding: SPACING.md }}
        ListHeaderComponent={
          <View style={{ marginBottom: SPACING.md }}>
            <Text style={styles.info}>
              Dodajte radnike putem emaila s kojim su registrirani u aplikaciji. Radnici mogu
              obrađivati narudžbe i rezervacije ovog objekta.
            </Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="email@radnika.com"
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Pressable style={styles.addBtn} onPress={handleAdd} disabled={adding}>
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addBtnText}>Dodaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Još nema radnika. Dodajte ih putem emaila iznad.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{item.naziv.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.naziv}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={[styles.shift, item.uSmjeni ? styles.shiftOn : styles.shiftOff]}>
                {item.uSmjeni ? '● U smjeni' : '○ Nije u smjeni'}
              </Text>
            </View>
            <Pressable style={styles.removeBtn} onPress={() => handleRemove(item)}>
              <Text style={styles.removeBtnText}>Ukloni</Text>
            </Pressable>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  info: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  addRow: { flexDirection: 'row', gap: SPACING.sm },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: FONT.body,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.small },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: FONT.subtitle },
  name: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  email: { fontSize: FONT.small, color: COLORS.textSecondary },
  shift: { fontSize: FONT.small, marginTop: 2 },
  shiftOn: { color: '#2e9e5b' },
  shiftOff: { color: COLORS.textSecondary },
  removeBtn: {
    borderWidth: 1,
    borderColor: '#d9534f',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  removeBtnText: { color: '#d9534f', fontSize: FONT.small, fontWeight: '600' },
});
