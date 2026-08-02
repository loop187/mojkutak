import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { sadrzajLabel, tipLabel } from '../constants/options';
import { Venue } from '../services/types';
import RatingStars from './RatingStars';

interface Props {
  venue: Venue;
  onPress: () => void;
}

export default function VenueCard({ venue, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {venue.coverPhoto ? (
        <Image source={{ uri: venue.coverPhoto }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Text style={styles.coverEmoji}>☕</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{venue.naziv}</Text>
          <Text style={styles.tip}>{tipLabel(venue.tip)}</Text>
        </View>
        <Text style={styles.location} numberOfLines={1}>
          {[venue.adresa, venue.mjesto].filter(Boolean).join(', ') || '—'}
          {venue.distanceKm != null ? ` · ${venue.distanceKm} km` : ''}
        </Text>
        <View style={styles.footer}>
          <RatingStars rating={venue.ratingAvg} />
          <Text style={styles.ratingText}>
            {venue.ratingCount > 0 ? `${venue.ratingAvg.toFixed(1)} (${venue.ratingCount})` : 'Bez ocjena'}
          </Text>
        </View>
        {venue.sadrzaji.length > 0 && (
          <View style={styles.chips}>
            {venue.sadrzaji.slice(0, 3).map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{sadrzajLabel(s)}</Text>
              </View>
            ))}
            {venue.sadrzaji.length > 3 && (
              <Text style={styles.moreText}>+{venue.sadrzaji.length - 3}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cover: { width: '100%', height: 140 },
  coverPlaceholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 42 },
  body: { padding: SPACING.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  tip: { fontSize: FONT.small, color: COLORS.primary, fontWeight: '600' },
  location: { fontSize: FONT.small, color: COLORS.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  ratingText: { fontSize: FONT.small, color: COLORS.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.sm, alignItems: 'center' },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  chipText: { fontSize: FONT.tiny, color: COLORS.primaryDark, fontWeight: '600' },
  moreText: { fontSize: FONT.tiny, color: COLORS.textSecondary },
});
