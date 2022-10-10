import { v4 as uuidV4 } from 'uuid';
import { TransactWriteCommand, TransactWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import type { SQSHandler } from 'aws-lambda';
import getDBDocumentClient from 'src/dbUtils/DynamoDb/getDBDocumentClient';
import { ProductWithStock } from 'src/types/apiTypes';

type ProductToInsert = Omit<ProductWithStock, 'id'>;

const isProvidedProductDataValid = (productData: any): productData is ProductToInsert => {
  if (typeof productData !== 'object') return false;
  if (typeof productData.title !== 'string') return false;
  if (typeof productData.price !== 'number' || productData.price <= 0) return false;
  if (typeof productData.count !== 'number' || productData.count <= 0) return false;
  if (productData.description !== undefined && typeof productData.description !== 'string') return false;
  if (productData.imageSrc !== undefined && typeof productData.imageSrc !== 'string') return false;
  return true;
};

export const catalogBatchProcess: SQSHandler = async (event) => {
  try {
    const { productsToInsert, invalidRecords } = event.Records.reduce<{
      productsToInsert: ProductToInsert[];
      invalidRecords: any[];
    }>((acc, record) => {
      const queueMessage = JSON.parse(record.body);
      if (isProvidedProductDataValid(queueMessage)) {
        acc.productsToInsert.push(queueMessage);
        return acc;
      }
      acc.invalidRecords.push(queueMessage);
      return acc;
    }, { productsToInsert: [], invalidRecords: [] });

    const documentClient = getDBDocumentClient();

    const insertProductPromises = productsToInsert.map<Promise<TransactWriteCommandOutput>>((producrtData) => {
      const { count, ...product } = producrtData;

      const newProductId = uuidV4();
      const productToInsert = { ...product, id: newProductId };
      const stockToInsert = { productId: newProductId, count };

      return documentClient.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { Item: productToInsert, TableName: process.env.PRODUCTS_TABLE } },
          { Put: { Item: stockToInsert, TableName: process.env.STOCKS_TABLE } },
        ],
      }));
    });

    const insertProductOutputs = await Promise.all(insertProductPromises);

    const { insertedProducts, notInsertedProducts } = insertProductOutputs.reduce<{
      insertedProducts: ProductToInsert[];
      notInsertedProducts: ProductToInsert[];
    }>((acc, transactionOutput, index) => {
      if (transactionOutput.$metadata.httpStatusCode !== 200) {
        acc.notInsertedProducts.push(productsToInsert[index]);
        return acc;
      };

      acc.insertedProducts.push(productsToInsert[index]);
      return acc;
    }, { insertedProducts: [], notInsertedProducts: [] });

    const snsClient = new SNSClient({ region: 'eu-west-1' });

    for (let insertedProduct of insertedProducts) {
      await snsClient.send(new PublishCommand({
        Subject: 'Product import',
        Message: `Imported product data: ${JSON.stringify(insertedProduct)};`,
        MessageAttributes: {
          price: { DataType: 'Number', StringValue: `${insertedProduct.price}` },
        },
        TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
      }));
    }

    if (notInsertedProducts.length > 0 || invalidRecords.length > 0) {
      await snsClient.send(new PublishCommand({
        Subject: 'Products which was not imported',
        Message: `
          Products failed to import: ${JSON.stringify(notInsertedProducts)};
          Products with wrong field values: ${JSON.stringify(invalidRecords)};
        `,
        TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
      }));
    }

  } catch (e) {
    console.error('Error appeared during product creating', e);
  }
};
