import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import PostCard from '../../components/PostCard';
import { COLORS, FONT, SPACING } from '../../constants/theme';
import { apiErrorMessage } from '../../services/api';
import { getFeed } from '../../services/posts';
import { Post } from '../../services/types';

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPosts(await getFeed());
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
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.md }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => router.push(`/venues/${item.venueId}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Nema novosti 📭</Text>
            <Text style={styles.emptyText}>
              Zaprati svoje omiljene objekte i ovdje ćeš vidjeti njihove ponude i evente.
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
