import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { PRODUCTS_TABLE } from '../../constants/TableNames';
import productList from '../initialData/productList';

const createProductTableIfNeeded = async (dbClient: DynamoDB): Promise<boolean> => {
  try {
    const tables = await dbClient.listTables({});
    if (tables.TableNames.includes(PRODUCTS_TABLE)) return true;

    console.log('Creating Products table...');

    const tableCreationResult = await dbClient.createTable({
      TableName: PRODUCTS_TABLE,
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
      StreamSpecification: {
        StreamEnabled: false,
      }
    });

    return tableCreationResult.$metadata.httpStatusCode === 200;
  } catch (e) {
    console.log('Error appeared during table creating:', e);
    return false;
  }
};

const insertProducts = async (dbClient: DynamoDB): Promise<boolean> => {
  try {
    console.log('Inserting Products...');
    const insertResult = await dbClient.batchWriteItem({
      RequestItems:
      {
        [PRODUCTS_TABLE]: productList.map((product) => ({
          PutRequest: {
            Item: {
              id: { S: product.id },
              description: { S: product.description },
              imageSrc: { S: product.imageSrc },
              price: { N: `${product.price}` },
              title: { S: product.title },
            }
          }
        })),
      }
    });

    return Object.keys(insertResult.UnprocessedItems).length === 0;
  } catch (e) {
    console.log('Error appeared during product inserting:', e);
    return false;
  }
};

(async () => {
  console.log('Start adding products...');
  const dbClient = new DynamoDB({ region: 'eu-west-1' });
  const isTableCreated = await createProductTableIfNeeded(dbClient);

  if (!isTableCreated) {
    console.log(`Products table doesn't exist. Exiting...`);
    return;
  }

  const areProductsInserted = await insertProducts(dbClient);

  if (!areProductsInserted) {
    console.log(`Products were not inserted. Exiting...`);
    return;
  }

  console.log('Products are successfully inserted');
})();