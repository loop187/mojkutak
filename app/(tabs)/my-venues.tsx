import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import VenueCard from '../../components/VenueCard';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { Venue } from '../../services/types';
import { getMyVenues } from '../../services/venues';

export default function MyVenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setVenues(await getMyVenues());
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

  return (
    <View style={styles.container}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <VenueCard venue={item} onPress={() => router.push(`/owner/venue/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Još nemaš objekata 🏪</Text>
            <Text style={styles.emptyText}>Dodaj svoj prvi objekt i postani vidljiv gostima.</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/owner/venue-edit')}>
        <Text style={styles.fabText}>+ Dodaj objekt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  error: { color: COLORS.danger, padding: SPACING.md, fontSize: FONT.small },
  emptyBox: { alignItems: 'center', marginTop: SPACING.xl, paddingHorizontal: SPACING.lg },
  emptyTitle: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  emptyText: { fontSize: FONT.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm },
  fab: {
    position: 'absolute',
    bottom: SPACING.lg,
    right: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
