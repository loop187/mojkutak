import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import VenueCard from '../../components/VenueCard';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { VENUE_TIPOVI } from '../../constants/options';
import { apiErrorMessage } from '../../services/api';
import { Venue } from '../../services/types';
import { listVenues } from '../../services/venues';

export default function SearchScreen() {
  const router = useRouter();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState('');
  const [tip, setTip] = useState<string | null>(null);
  const [sort, setSort] = useState<'najnovije' | 'rating' | 'udaljenost'>('najnovije');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GPS (opcionalno — za sortiranje po udaljenosti)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        // ignore
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await listVenues({
        search: search || undefined,
        tip: tip ?? undefined,
        sort,
        lat: coords?.lat,
        lng: coords?.lng,
        per_page: 50,
      });
      setVenues(result.items);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }, [search, tip, sort, coords]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Pretraži objekte..."
        placeholderTextColor={COLORS.textSecondary}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: SPACING.xs, paddingHorizontal: SPACING.md }}>
        <Pressable style={[styles.filterChip, tip === null && styles.filterChipActive]} onPress={() => setTip(null)}>
          <Text style={[styles.filterText, tip === null && styles.filterTextActive]}>Sve</Text>
        </Pressable>
        {VENUE_TIPOVI.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.filterChip, tip === t.value && styles.filterChipActive]}
            onPress={() => setTip(tip === t.value ? null : t.value)}
          >
            <Text style={[styles.filterText, tip === t.value && styles.filterTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        {([
          ['najnovije', 'Najnovije'],
          ['rating', 'Ocjena'],
          ['udaljenost', 'Udaljenost'],
        ] as const).map(([value, label]) => (
          <Pressable
            key={value}
            style={[styles.sortBtn, sort === value && styles.sortBtnActive]}
            onPress={() => setSort(value)}
          >
            <Text style={[styles.sortText, sort === value && styles.sortTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={venues}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <VenueCard venue={item} onPress={() => router.push(`/venues/${item.id}`)} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Nema objekata za zadane filtere.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  search: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    margin: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT.body,
    color: COLORS.text,
  },
  filterRow: { maxHeight: 40, marginBottom: SPACING.sm },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONT.small, lineHeight: FONT.small, color: COLORS.text },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  sortRow: { flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: SPACING.md, marginBottom: SPACING.xs },
  sortBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.sm },
  sortBtnActive: { backgroundColor: COLORS.primaryLight },
  sortText: { fontSize: FONT.small, color: COLORS.textSecondary },
  sortTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  error: { color: COLORS.danger, paddingHorizontal: SPACING.md, fontSize: FONT.small },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.xl },
});
