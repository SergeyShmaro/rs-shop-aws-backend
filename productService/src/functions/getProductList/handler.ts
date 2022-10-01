import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import productList from 'src/constants/productList';
import type { Product } from 'src/types/product';

export const getProductList: APIGatewayProxyHandlerV2<Product[]> = async () => {
  return productList;
};
