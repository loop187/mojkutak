import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import ReservationCard from '../../components/ReservationCard';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import {
  confirmReservation,
  getVenueReservations,
  rejectReservation,
} from '../../services/reservations';
import { Reservation } from '../../services/types';

export default function VenueReservationsScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!venueId) return;
    try {
      const r = await getVenueReservations(venueId, filter === 'pending' ? 'pending' : undefined);
      setReservations(r);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  }, [venueId, filter]);

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
      <Stack.Screen options={{ headerShown: true, title: 'Rezervacije' }} />
      <View style={styles.container}>
        <View style={styles.filterRow}>
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
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  filterBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT.small, color: COLORS.text, fontWeight: '600' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
});
