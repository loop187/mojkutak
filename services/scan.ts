import api from './api';
import { Venue } from './types';

export interface QrScanResult {
  venue: Venue;
  brojStola: number;
  code: string;
}

export async function scanQrCode(code: string): Promise<QrScanResult> {
  const { data } = await api.get<QrScanResult>(`/scan/${code}`);
  return data;
}
