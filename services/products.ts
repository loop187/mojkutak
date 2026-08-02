import api from './api';
import { LicenseProduct } from './types';

export async function getLicenseProduct(): Promise<LicenseProduct> {
  const { data } = await api.get<LicenseProduct>('/products');
  return data;
}

export interface PurchaseResult {
  orderId: string;
  orderStatus: string;
  total: string;
  currency: string;
  message: string;
}

export async function purchaseLicense(variationId: string): Promise<PurchaseResult> {
  const { data } = await api.post<PurchaseResult>('/products/purchase', {
    variationId,
  });
  return data;
}
