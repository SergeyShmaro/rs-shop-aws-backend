import { v4 as uuidV4 } from 'uuid';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import getDBDocumentClient from 'src/dbUtils/DynamoDb/getDBDocumentClient';
import { ProductWithStock } from 'src/types/apiTypes';

const isProvidedProductDataValid = (productData: any): productData is Omit<ProductWithStock, 'id'> => {
  if (typeof productData !== 'object') return false;
  if (typeof productData.title !== 'string') return false;
  if (typeof productData.price !== 'number') return false;
  if (typeof productData.count !== 'number') return false;
  if (productData.description !== undefined && typeof productData.description !== 'string') return false;
  if (productData.imageSrc !== undefined && typeof productData.imageSrc !== 'string') return false;
  return true;
};

export const createProduct: APIGatewayProxyHandlerV2<string> = async (event) => {
  console.log(`Start creating product with data: ${event.body}`, event);
  const productData = JSON.parse(event.body) ?? {};

  if (!isProvidedProductDataValid(productData)) {
    return { statusCode: 400, body: 'Provided product data is invalid' };
  }

  const { count, ...product } = productData;

  const newProductId = uuidV4();
  const productToInsert = { ...product, id: newProductId };
  const stockToInsert = { productId: newProductId, count };

  try {
    const documentClient = getDBDocumentClient();
    const transactionOutput = await documentClient.send(new TransactWriteCommand({
      TransactItems: [
        { Put: { Item: productToInsert, TableName: process.env.PRODUCTS_TABLE } },
        { Put: { Item: stockToInsert, TableName: process.env.STOCKS_TABLE } },
      ],
    }));

    const { httpStatusCode } = transactionOutput.$metadata;
    if (httpStatusCode !== 200) {
      throw new Error(`Request to DB returned ${httpStatusCode} status code`);
    };

    return { statusCode: 200, body: newProductId };
  } catch (e) {
    console.error('Error appeared during product creating', e);
    return { statusCode: 500, body: `Something went wrong during product retrieving` };
  }
};
