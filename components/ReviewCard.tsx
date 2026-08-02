import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { Review } from '../services/types';
import RatingStars from './RatingStars';

interface Props {
  review: Review;
}

export default function ReviewCard({ review }: Props) {
  const date = new Date(review.createdAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {review.userPhoto ? (
          <Image source={{ uri: review.userPhoto }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{review.userName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{review.userName}</Text>
          <Text style={styles.date}>
            {date.getDate()}.{date.getMonth() + 1}.{date.getFullYear()}.
          </Text>
        </View>
        <RatingStars rating={review.ocjena} />
      </View>
      {!!review.komentar && <Text style={styles.comment}>{review.komentar}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: FONT.body, fontWeight: '600', color: COLORS.text },
  date: { fontSize: FONT.tiny, color: COLORS.textSecondary },
  comment: { fontSize: FONT.body, color: COLORS.text, marginTop: SPACING.sm },
});
