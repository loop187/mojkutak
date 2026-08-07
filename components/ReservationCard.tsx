import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';
import { Reservation, ReservationStatus } from '../services/types';

interface Props {
  reservation: Reservation;
  /** 'guest' prikazuje naziv objekta, 'owner' prikazuje ime gosta + akcije */
  perspective: 'guest' | 'owner';
  onConfirm?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđena',
  rejected: 'Odbijena',
  cancelled: 'Otkazana',
  completed: 'Završena',
};

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.success,
  rejected: COLORS.danger,
  cancelled: COLORS.textSecondary,
  completed: COLORS.info,
};

function formatDate(datum: string): string {
  const d = new Date(datum + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}.`;
}

export default function ReservationCard({ reservation, perspective, onConfirm, onReject, onCancel }: Props) {
  const title = perspective === 'guest'
    ? reservation.venueNaziv ?? 'Objekt'
    : reservation.userName ?? 'Gost';

  const canCancel = perspective === 'guest' && ['pending', 'confirmed'].includes(reservation.status);
  const canDecide = perspective === 'owner' && reservation.status === 'pending';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[reservation.status] }]}>
          <Text style={styles.badgeText}>{STATUS_LABELS[reservation.status]}</Text>
        </View>
      </View>

      <Text style={styles.detail}>
        📅 {formatDate(reservation.datum)} u {reservation.vrijeme} · 👥 {reservation.brojOsoba} {reservation.brojOsoba === 1 ? 'osoba' : 'osobe/a'}
        {reservation.stol ? ` · Stol ${reservation.stol}` : ''}
      </Text>

      {perspective === 'owner' && !!reservation.userPhone && (
        <Text style={styles.detail}>📞 {reservation.userPhone}</Text>
      )}
      {!!reservation.napomena && (
        <Text style={styles.note}>„{reservation.napomena}"</Text>
      )}
      {!!reservation.odgovorUgostitelja && (
        <Text style={styles.note}>Odgovor: {reservation.odgovorUgostitelja}</Text>
      )}

      {(canCancel || canDecide) && (
        <View style={styles.actions}>
          {canDecide && (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnConfirm]} onPress={onConfirm}>
                <Text style={styles.btnText}>Potvrdi</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={onReject}>
                <Text style={styles.btnText}>Odbij</Text>
              </TouchableOpacity>
            </>
          )}
          {canCancel && (
            <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={onCancel}>
              <Text style={styles.btnText}>Otkaži</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { fontSize: FONT.subtitle, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  badge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3 },
  badgeText: { fontSize: FONT.tiny, color: '#fff', fontWeight: '700' },
  detail: { fontSize: FONT.body, color: COLORS.text, marginBottom: 2 },
  note: { fontSize: FONT.small, color: COLORS.textSecondary, fontStyle: 'italic', marginTop: SPACING.xs },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  btn: { flex: 1, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  btnConfirm: { backgroundColor: COLORS.success },
  btnReject: { backgroundColor: COLORS.danger },
  btnCancel: { backgroundColor: COLORS.textSecondary },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FONT.small },
});
