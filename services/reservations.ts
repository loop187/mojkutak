import api from './api';
import { Reservation } from './types';

export interface ReservationInput {
  datum: string;      // YYYY-MM-DD
  vrijeme: string;    // HH:MM
  brojOsoba: number;
  napomena?: string;
}

export async function createReservation(venueId: string, input: ReservationInput): Promise<Reservation> {
  const { data } = await api.post<Reservation>(`/venues/${venueId}/reservations`, input);
  return data;
}

export async function getMyReservations(): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>('/reservations/my');
  return data;
}

export async function getVenueReservations(venueId: string, status?: string): Promise<Reservation[]> {
  const { data } = await api.get<Reservation[]>(`/venues/${venueId}/reservations`, {
    params: status ? { status } : {},
  });
  return data;
}

export async function confirmReservation(id: string, odgovor?: string): Promise<Reservation> {
  const { data } = await api.post<Reservation>(`/reservations/${id}/confirm`, { odgovor });
  return data;
}

export async function rejectReservation(id: string, odgovor?: string): Promise<Reservation> {
  const { data } = await api.post<Reservation>(`/reservations/${id}/reject`, { odgovor });
  return data;
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const { data } = await api.post<Reservation>(`/reservations/${id}/cancel`);
  return data;
}
