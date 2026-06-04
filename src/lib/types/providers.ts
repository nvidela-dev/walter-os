export const PROVIDER_TYPES = ["producto", "servicio"] as const;

export type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export interface ProviderView {
  id: string;
  name: string;
  description: string | null;
  type: ProviderType;
  days: string | null;
  debt: string;
}

export interface ProviderListRow extends ProviderView {
  productCount: number;
}

export interface ProviderProductView {
  id: string;
  productId: string;
  price: string;
  quantity: string;
  name: string;
  unitId: string | null;
  unit: string;
  unitName: string;
  description: string | null;
}

export interface ProviderDetail extends ProviderView {
  products: ProviderProductView[];
}

export interface ProductForProvider {
  id: string;
  name: string;
  unitId: string | null;
  unit: string;
  unitName: string;
  description: string | null;
  price: string;
}
