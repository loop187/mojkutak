import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import ReservationCard from '../../../components/ReservationCard';
import { COLORS, FONT, RADIUS, SPACING } from '../../../constants/theme';
import { apiErrorMessage } from '../../../services/api';
import {
  confirmReservation,
  getVenueReservations,
  rejectReservation,
} from '../../../services/reservations';
import { Reservation, Venue } from '../../../services/types';
import { getVenue } from '../../../services/venues';

export default function OwnerVenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [v, r] = await Promise.all([
        getVenue(id),
        getVenueReservations(id, filter === 'pending' ? 'pending' : undefined),
      ]);
      setVenue(v);
      setReservations(r);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  }, [id, filter]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleConfirm = async (reservation: Reservation) => {
    try {
      await confirmReservation(reservation.id);
      await load();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const handleReject = (reservation: Reservation) => {
    Alert.alert('Odbijanje', 'Želite li odbiti ovu rezervaciju?', [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Da, odbij',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectReservation(reservation.id);
            await load();
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: venue?.naziv ?? 'Objekt' }} />
      <View style={styles.container}>
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/staff?venueId=${id}`)}>
            <Text style={styles.actionIcon}>🧑‍🍳</Text>
            <Text style={styles.actionText}>Radnici</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/venues/${id}`)}>
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={styles.actionText}>Pregled</Text>
          </TouchableOpacity>
          {venue?.qrNarudzbe && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/qr-codes?venueId=${id}`)}>
              <Text style={styles.actionIcon}>📲</Text>
              <Text style={styles.actionText}>QR kodovi</Text>
            </TouchableOpacity>
          )}
          {(venue?.qrNarudzbe || venue?.dostava) && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/owner/orders?venueId=${id}`)}>
              <Text style={styles.actionIcon}>🧾</Text>
              <Text style={styles.actionText}>Narudžbe</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.sectionTitle}>Rezervacije</Text>
          <View style={styles.filterBtns}>
            {([
              ['pending', 'Na čekanju'],
              ['all', 'Sve'],
            ] as const).map(([key, label]) => (
              <Pressable
                key={key}
                style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
                onPress={() => setFilter(key)}
              >
                <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: SPACING.md, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              perspective="owner"
              onConfirm={() => handleConfirm(item)}
              onReject={() => handleReject(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'pending' ? 'Nema rezervacija na čekanju.' : 'Nema rezervacija.'}
            </Text>
          }
        />
      </View>
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
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 22 },
  actionText: { fontSize: FONT.tiny, color: COLORS.text, fontWeight: '600', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  filterBtns: { flexDirection: 'row', gap: SPACING.xs },
  filterBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.card,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT.small, color: COLORS.text },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
});
