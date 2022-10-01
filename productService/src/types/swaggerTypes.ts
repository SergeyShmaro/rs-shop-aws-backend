export interface SProduct {
  id: string;
  title: string;
  price: number;
  count: number;
  imageSrc?: string;
  description?: string;
}
export type SProductList = {
  id: string;
  title: string;
  price: number;
  count: number;
  imageSrc?: string;
  description?: string;
}[];

export type SProductPayload = {
  title: string;
  price: number;
  count: number;
  imageSrc?: string;
  description?: string;
}

export type SProductId = string;
