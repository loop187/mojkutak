import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from './api';
import { User } from './types';

interface AuthResponse {
  user: User;
  token: string;
}

export async function login(username: string, password: string): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
  role: 'owner' | 'user';
  naziv: string;
  mobile_number?: string;
}

export async function register(params: RegisterParams): Promise<User> {
  const { data } = await api.post<AuthResponse>('/auth/register', params);
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

export async function validate(): Promise<User | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  try {
    const { data } = await api.get<User>('/auth/validate');
    return data;
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function updateProfile(params: { naziv?: string; mobile_number?: string }): Promise<User> {
  const { data } = await api.put<User>('/users/profile', params);
  return data;
}

export async function uploadProfilePhoto(imageBase64: string, mime = 'image/jpeg'): Promise<string> {
  const { data } = await api.post<{ photoUrl: string }>('/users/profile-photo', { imageBase64, mime });
  return data.photoUrl;
}
