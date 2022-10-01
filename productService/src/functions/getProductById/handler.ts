import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import getDBDocumentClient from 'src/dbUtils/DynamoDb/getDBDocumentClient';
import type { Product } from 'src/types/product';
import { ProductWithStock } from 'src/types/apiTypes';
import { Stock } from 'src/types/stock';
import { validate } from 'uuid';

export const getProductById: APIGatewayProxyHandlerV2<ProductWithStock> = async (event) => {
  const { productId } = event?.pathParameters ?? {};

  console.log(`Start retrieving product with id: ${productId}`, event);

  if (!validate(productId)) return { statusCode: 400, body: `Wrong productId parameter` };

  try {
    const documentClient = getDBDocumentClient();
    const products = await documentClient.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      KeyConditionExpression: "id = :id",
      ExpressionAttributeValues: { ":id": productId },
    }));

    if (products.Items.length !== 1 || !products.Items[0]) {
      return { statusCode: 404, body: `Product with provided id was not found` };
    }

    const product = products.Items[0] as Product;

    const stocks = await documentClient.send(new QueryCommand({
      TableName: process.env.STOCKS_TABLE,
      KeyConditionExpression: "productId = :productId",
      ExpressionAttributeValues: { ":productId": productId },
    }));

    const stock = stocks.Items[0] as Stock;

    return { ...product, count: stock.count ?? 0 };
  } catch (e) {
    console.error('Error appeared during product retrieving', e);
    return { statusCode: 500, body: `Something went wrong during product retrieving` };
  }
};
