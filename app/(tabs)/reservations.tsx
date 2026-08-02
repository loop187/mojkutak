import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import ReservationCard from '../../components/ReservationCard';
import { COLORS, FONT, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { cancelReservation, getMyReservations } from '../../services/reservations';
import { Reservation } from '../../services/types';

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setReservations(await getMyReservations());
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }, []);

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

  const handleCancel = (reservation: Reservation) => {
    Alert.alert('Otkazivanje', 'Želite li otkazati ovu rezervaciju?', [
      { text: 'Ne', style: 'cancel' },
      {
        text: 'Da, otkaži',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReservation(reservation.id);
            load();
          } catch (e) {
            Alert.alert('Greška', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            perspective="guest"
            onCancel={() => handleCancel(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nema rezervacija 📅</Text>
            <Text style={styles.emptyText}>
              Pronađi objekt i rezerviraj svoj stol u par klikova.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  error: { color: COLORS.danger, padding: SPACING.md, fontSize: FONT.small },
  emptyBox: { alignItems: 'center', marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  emptyTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONT.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
});
