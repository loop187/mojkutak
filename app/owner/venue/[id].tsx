import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../../constants/theme';
import { apiErrorMessage } from '../../../services/api';
import { Venue } from '../../../services/types';
import { getVenue } from '../../../services/venues';

export default function OwnerVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const v = await getVenue(id);
      setVenue(v);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: venue?.naziv ?? 'Objekt' }} />
      <ScrollView style={styles.container}>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/venue-edit?id=${id}`)}>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionText}>Uredi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/menu-edit?venueId=${id}`)}>
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionText}>Meni</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/post-create?venueId=${id}`)}>
            <Text style={styles.actionIcon}>📢</Text>
            <Text style={styles.actionText}>Objava</Text>
          </TouchableOpacity>
          {venue?.rezervacijeUkljucene && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/reservations?venueId=${id}`)}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionText}>Rezervacije</Text>
            </TouchableOpacity>
          )}
          {(venue?.qrNarudzbe || venue?.dostava) && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/orders?venueId=${id}`)}>
              <Text style={styles.actionIcon}>🧾</Text>
              <Text style={styles.actionText}>Narudžbe</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/staff?venueId=${id}`)}>
            <Text style={styles.actionIcon}>🧑‍🍳</Text>
            <Text style={styles.actionText}>Radnici</Text>
          </TouchableOpacity>
          {venue?.qrNarudzbe && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/qr-codes?venueId=${id}`)}>
              <Text style={styles.actionIcon}>📲</Text>
              <Text style={styles.actionText}>QR kodovi</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/venues/${id}`)}>
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={styles.actionText}>Pregled</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  actionBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 22 },
  actionText: { fontSize: FONT.tiny, color: COLORS.text, fontWeight: '600', marginTop: 2 },
});
