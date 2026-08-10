import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { apiErrorMessage } from '../services/api';
import { getVenueMenu } from '../services/venues';
import { MenuCategory, MenuItem } from '../services/types';
import { createOrder } from '../services/orders';
import { QrScanResult, scanQrCode } from '../services/scan';

interface CartItem {
  item: MenuItem;
  kolicina: number;
}

export default function NaruciScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const [scan, setScan] = useState<QrScanResult | null>(null);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [napomena, setNapomena] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!code) return;
    (async () => {
      try {
        const result = await scanQrCode(code);
        setScan(result);
        const menuData = await getVenueMenu(String(result.venue.id));
        setMenu(menuData);
      } catch (e) {
        Alert.alert('Greška', apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const ukupno = useMemo(() => {
    return Object.values(cart).reduce((sum, ci) => sum + ci.item.cijena * ci.kolicina, 0);
  }, [cart]);

  const updateCart = (item: MenuItem, delta: number) => {
    setCart((prev) => {
      const current = prev[item.id]?.kolicina ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { item, kolicina: next } };
    });
  };

  const submit = async () => {
    const items = Object.values(cart).map((ci) => ({
      menuItemId: ci.item.id,
      kolicina: ci.kolicina,
    }));
    if (items.length === 0) {
      Alert.alert('Košarica je prazna');
      return;
    }
    setSending(true);
    try {
      await createOrder(code, items, napomena || undefined);
      Alert.alert('Narudžba zaprimljena', 'Konobar će vam uskoro donijeti narudžbu.');
      setCart({});
      setNapomena('');
    } catch (e) {
      Alert.alert('Greška', apiErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!scan) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.empty}>QR kod nije pronađen.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={{ padding: SPACING.md, paddingTop: insets.top + SPACING.md, paddingBottom: 140 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{scan.venue.naziv}</Text>
          <Text style={styles.subtitle}>Stol {scan.brojStola}</Text>
        </View>

        <Text style={styles.section}>Meni</Text>
        {menu.length === 0 && <Text style={styles.empty}>Meni je prazan.</Text>}
        {menu.map((category) => (
          <View key={category.id} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.naziv}</Text>
            {category.items.map((item) => {
              const cartItem = cart[item.id];
              return (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.naziv}</Text>
                    <Text style={styles.itemPrice}>{item.cijena.toFixed(2)} €</Text>
                  </View>
                  {!!item.opis && <Text style={styles.itemDesc}>{item.opis}</Text>}
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyBtn} onPress={() => updateCart(item, -1)} disabled={!cartItem}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyText}>{cartItem?.kolicina ?? 0}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => updateCart(item, 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <Text style={styles.section}>Napomena</Text>
        <TextInput
          style={styles.input}
          value={napomena}
          onChangeText={setNapomena}
          placeholder="Npr. bez leda, bez luka..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={3}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Text style={styles.total}>Ukupno: {ukupno.toFixed(2)} €</Text>
        <Pressable style={styles.orderBtn} onPress={submit} disabled={sending}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderBtnText}>Naruči</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  empty: { color: COLORS.textSecondary, fontSize: FONT.body },
  header: { marginBottom: SPACING.md },
  title: { fontSize: FONT.title, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONT.subtitle, color: COLORS.textSecondary, marginTop: SPACING.xs },
  section: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  category: { marginBottom: SPACING.md },
  categoryTitle: { fontSize: FONT.body, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  item: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xs },
  itemName: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  itemPrice: { fontSize: FONT.body, color: COLORS.text, fontWeight: '700' },
  itemDesc: { fontSize: FONT.small, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm },
  qtyBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  qtyText: { width: 40, textAlign: 'center', fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  total: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  orderBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT.body },
});
