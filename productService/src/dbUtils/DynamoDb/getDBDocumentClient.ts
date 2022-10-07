import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export default () => {
  const dbClient = new DynamoDB({ region: 'eu-west-1' });
  const documentClient = DynamoDBDocumentClient.from(dbClient);
  return documentClient;
};