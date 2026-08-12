import React, { useCallback, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { getMyVenues } from '../../services/venues';
import { Venue } from '../../services/types';

export default function StaffTabScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);

  useFocusEffect(
    useCallback(() => {
      getMyVenues().then(setVenues).catch(() => {});
    }, [])
  );

  return (
    <FlatList
      style={styles.container}
      data={venues}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: SPACING.md }}
      ListHeaderComponent={
        <Text style={styles.info}>Odaberite objekt za upravljanje radnicima.</Text>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nemate objekata.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/owner/staff?venueId=${item.id}`)}
        >
          {item.coverPhoto ? (
            <Image source={{ uri: item.coverPhoto }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Text style={{ fontSize: 22 }}>🏪</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.naziv}</Text>
            <Text style={styles.meta}>{item.mjesto || '—'}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  info: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.md },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
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
  cover: { width: 48, height: 48, borderRadius: RADIUS.md },
  coverPlaceholder: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: FONT.small, color: COLORS.textSecondary },
  chevron: { fontSize: 26, color: COLORS.textSecondary },
});
