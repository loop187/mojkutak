import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { postTipLabel } from '../constants/options';
import { Post } from '../services/types';

interface Props {
  post: Post;
  onPress?: () => void;
}

const TIP_COLORS: Record<string, string> = {
  ponuda: COLORS.accent,
  event: COLORS.info,
  obavijest: COLORS.textSecondary,
};

function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function PostCard({ post, onPress }: Props) {
  const pocetak = formatDateTime(post.pocetak);

  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      {post.slika && <Image source={{ uri: post.slika }} style={styles.image} />}
      <View style={styles.body}>
        <View style={styles.header}>
          {post.venueNaziv && <Text style={styles.venue} numberOfLines={1}>{post.venueNaziv}</Text>}
          <View style={[styles.badge, { backgroundColor: TIP_COLORS[post.tip] ?? COLORS.textSecondary }]}>
            <Text style={styles.badgeText}>{postTipLabel(post.tip)}</Text>
          </View>
        </View>
        <Text style={styles.title}>{post.naslov}</Text>
        {!!post.opis && <Text style={styles.opis} numberOfLines={3}>{post.opis}</Text>}
        {pocetak && <Text style={styles.date}>📅 {pocetak}</Text>}
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
  image: { width: '100%', height: 160 },
  body: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  venue: { fontSize: FONT.small, color: COLORS.primary, fontWeight: '700', flex: 1, marginRight: SPACING.sm },
  badge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  badgeText: { fontSize: FONT.tiny, color: '#fff', fontWeight: '700' },
  title: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text },
  opis: { fontSize: FONT.body, color: COLORS.textSecondary, marginTop: SPACING.xs },
  date: { fontSize: FONT.small, color: COLORS.text, marginTop: SPACING.sm },
});
