import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import productList from 'src/constants/productList';
import type { Product } from 'src/types/product';

const PRODUCT_ID_LENGTH = 36;

export const getProductById: APIGatewayProxyHandlerV2<Product> = async (event) => {
  const { pathParameters } = event;

  if (pathParameters?.productId?.length !== PRODUCT_ID_LENGTH) {
    return {
      statusCode: 400,
      body: `Wrong productId parameter`,
    }
  }

  const product = productList.find(({ id }) => id === pathParameters?.productId);

  if (!product) {
    return {
      statusCode: 404,
      body: `Product with provided id was not found`,
    };
  }

  return product;
};
