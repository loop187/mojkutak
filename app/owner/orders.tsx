import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { getOwnerOrders, markOrderDone, Order } from '../../services/orders';

type Filter = 'active' | 'done';

export default function VenueOrdersScreen() {
  const { venueId } = useLocalSearchParams<{ venueId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!venueId) return;
    try {
      const data = await getOwnerOrders(venueId);
      setOrders(data);
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [venueId]);

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

  const handleDone = async (order: Order) => {
    try {
      await markOrderDone(order.id);
      await load();
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    }
  };

  const filtered = orders.filter((o) =>
    filter === 'active' ? o.status !== 'done' : o.status === 'done'
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Narudžbe' }} />
      <View style={styles.container}>
        <View style={styles.filterRow}>
          {(
            [
              ['active', 'Aktivne'],
              ['done', 'Odrađene'],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: SPACING.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {filter === 'active' ? 'Nema aktivnih narudžbi.' : 'Nema odrađenih narudžbi.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.table}>
                  {item.tip === 'dostava' ? '🛵 Dostava' : `Stol ${item.brojStola}`}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt.replace(' ', 'T')).toLocaleTimeString('hr-HR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {item.tip === 'dostava' && (
                <View style={{ marginBottom: SPACING.xs }}>
                  {!!item.adresa && <Text style={styles.delivery}>📍 {item.adresa}</Text>}
                  {!!item.telefon && <Text style={styles.delivery}>📞 {item.telefon}</Text>}
                </View>
              )}
              {item.items.map((oi) => (
                <View key={oi.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {oi.kolicina}× {oi.naziv}
                  </Text>
                  <Text style={styles.itemPrice}>{(oi.cijena * oi.kolicina).toFixed(2)} €</Text>
                </View>
              ))}
              {!!item.napomena && <Text style={styles.note}>Napomena: {item.napomena}</Text>}
              <View style={styles.cardFooter}>
                <Text style={styles.total}>Ukupno: {item.ukupno.toFixed(2)} €</Text>
                {item.status !== 'done' && (
                  <Pressable style={styles.doneBtn} onPress={() => handleDone(item)}>
                    <Text style={styles.doneBtnText}>Odrađeno</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    paddingBottom: 0,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: FONT.small },
  filterTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: SPACING.lg },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  table: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  time: { fontSize: FONT.small, color: COLORS.textSecondary },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  itemName: { fontSize: FONT.body, color: COLORS.text },
  itemPrice: { fontSize: FONT.body, color: COLORS.textSecondary },
  note: { fontSize: FONT.small, color: COLORS.textSecondary, marginTop: SPACING.xs, fontStyle: 'italic' },
  delivery: { fontSize: FONT.small, color: COLORS.text, marginBottom: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  total: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.small },
});
