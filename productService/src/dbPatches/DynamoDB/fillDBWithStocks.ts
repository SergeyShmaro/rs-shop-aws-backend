import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { STOCKS_TABLE } from '../../constants/TableNames';
import stockList from '../initialData/stockList';

const insertStocks = async (dbClient: DynamoDB): Promise<boolean> => {
  try {
    console.log('Inserting stocks...');
    const insertResult = await dbClient.batchWriteItem({
      RequestItems:
      {
        [STOCKS_TABLE]: stockList.map((stock) => ({
          PutRequest: {
            Item: {
              productId: { S: stock.productId },
              count: { N: `${stock.count}` },
            }
          }
        })),
      }
    });

    return Object.keys(insertResult.UnprocessedItems).length === 0;
  } catch (e) {
    console.log('Error appeared during stock inserting:', e);
    return false;
  }
};

(async () => {
  console.log('Start adding stocks...');
  const dbClient = new DynamoDB({ region: 'eu-west-1' });

  const areStocksInserted = await insertStocks(dbClient);

  if (!areStocksInserted) {
    console.log(`Stocks were not inserted. Exiting...`);
    return;
  }

  console.log('Stocks are successfully inserted');
})();