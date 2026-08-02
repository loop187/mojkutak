import api from './api';
import { Post } from './types';

export async function getVenuePosts(venueId: string, sve = false): Promise<Post[]> {
  const { data } = await api.get<Post[]>(`/venues/${venueId}/posts`, {
    params: sve ? { sve: 1 } : {},
  });
  return data;
}

export async function getFeed(page = 1): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/posts/feed', { params: { page } });
  return data;
}

export interface PostInput {
  tip?: 'ponuda' | 'event' | 'obavijest';
  naslov?: string;
  opis?: string;
  pocetak?: string | null;
  kraj?: string | null;
  aktivno?: boolean;
  imageBase64?: string;
  mime?: string;
}

export async function createPost(venueId: string, input: PostInput): Promise<Post> {
  const { data } = await api.post<Post>(`/venues/${venueId}/posts`, input);
  return data;
}

export async function updatePost(id: string, input: PostInput): Promise<Post> {
  const { data } = await api.put<Post>(`/posts/${id}`, input);
  return data;
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`);
}
