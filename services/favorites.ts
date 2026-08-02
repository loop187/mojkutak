import api from './api';
import { Venue } from './types';

export async function getFavorites(): Promise<Venue[]> {
  const { data } = await api.get<Venue[]>('/favorites');
  return data;
}

export async function addFavorite(venueId: string): Promise<void> {
  await api.post(`/venues/${venueId}/favorite`);
}

export async function removeFavorite(venueId: string): Promise<void> {
  await api.delete(`/venues/${venueId}/favorite`);
}
