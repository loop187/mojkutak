import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

export const TOKEN_KEY = 'mojkutak_token';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const msg = (error.response?.data as { message?: string } | undefined)?.message;
    if (msg) return msg;
    if (error.code === 'ECONNABORTED') return 'Isteklo je vrijeme zahtjeva. Pokušajte ponovno.';
    if (!error.response) return 'Nema veze s poslužiteljem. Provjerite internet.';
  }
  return 'Došlo je do greške. Pokušajte ponovno.';
}

export default api;
