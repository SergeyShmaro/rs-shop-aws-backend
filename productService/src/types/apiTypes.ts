import { Product } from "./product";
import { Stock } from "./stock";

export interface ProductWithStock extends Product, Omit<Stock, 'productId'> { }
