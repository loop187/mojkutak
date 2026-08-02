import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  rating: number;
  size?: number;
  onRate?: (value: number) => void;
}

export default function RatingStars({ rating, size = 16, onRate }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(rating);
        const star = (
          <Text key={i} style={{ fontSize: size, color: filled ? COLORS.star : COLORS.border }}>
            ★
          </Text>
        );
        if (!onRate) return star;
        return (
          <Pressable key={i} onPress={() => onRate(i)} hitSlop={6}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
});
