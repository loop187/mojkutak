import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { MenuCategory } from '../services/types';

interface Props {
  category: MenuCategory;
}

export default function MenuSection({ category }: Props) {
  const items = category.items.filter((i) => i.dostupno);
  if (items.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{category.naziv}</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.naziv}</Text>
            {!!item.opis && <Text style={styles.itemOpis}>{item.opis}</Text>}
          </View>
          <Text style={styles.price}>
            {item.cijena.toFixed(2)} {item.valuta === 'EUR' ? '€' : item.valuta}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  itemName: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text },
  itemOpis: { fontSize: FONT.small, color: COLORS.textSecondary, marginTop: 1 },
  price: { fontSize: FONT.body, fontWeight: '700', color: COLORS.text },
});
