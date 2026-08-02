import api from './api';
import { Review } from './types';

export async function getVenueReviews(venueId: string): Promise<Review[]> {
  const { data } = await api.get<Review[]>(`/venues/${venueId}/reviews`);
  return data;
}

export async function createReview(venueId: string, ocjena: number, komentar = ''): Promise<Review> {
  const { data } = await api.post<Review>(`/venues/${venueId}/reviews`, { ocjena, komentar });
  return data;
}

export async function updateReview(id: string, input: { ocjena?: number; komentar?: string }): Promise<Review> {
  const { data } = await api.put<Review>(`/reviews/${id}`, input);
  return data;
}

export async function deleteReview(id: string): Promise<void> {
  await api.delete(`/reviews/${id}`);
}
