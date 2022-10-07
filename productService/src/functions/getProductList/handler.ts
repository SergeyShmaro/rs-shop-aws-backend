import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import getDBDocumentClient from 'src/dbUtils/DynamoDb/getDBDocumentClient';
import type { Product } from 'src/types/product';
import { ProductWithStock } from 'src/types/apiTypes';
import { Stock } from 'src/types/stock';

export const getProductList: APIGatewayProxyHandlerV2<ProductWithStock[]> = async (event) => {
  console.log('Start retrieving available products', event);
  try {
    const documentClient = getDBDocumentClient();
    const scanProductsOutput = await documentClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE,
    }));

    const products = (scanProductsOutput.Items as unknown) as Product[];
    const scanSrocksOutput = await documentClient.send(new ScanCommand({
      TableName: process.env.STOCKS_TABLE,
    }));

    const stocks = (scanSrocksOutput.Items as unknown) as Stock[];

    return products.map((product) => {
      const stock = stocks.find(({ productId }) => product.id === productId);
      return { ...product, count: stock.count };
    });
  } catch (e) {
    console.error('Error appeared during products retrieving', e);
    return {
      statusCode: 500,
      body: 'Error appeared during products retrieving',
    }
  }
};
