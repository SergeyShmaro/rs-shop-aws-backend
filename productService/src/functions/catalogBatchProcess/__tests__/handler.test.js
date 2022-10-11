jest.mock('@aws-sdk/lib-dynamodb', () => ({ TransactWriteCommand: function () { } }));
jest.mock('@aws-sdk/client-sns', () => ({
  PublishCommand: jest.fn(),
  SNSClient: jest.fn().mockReturnValue({ send: jest.fn() }),
}));
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { catalogBatchProcess } from '../handler'
import * as getDBDocumentClient from 'src/dbUtils/DynamoDb/getDBDocumentClient';

const testRecord1 = { title: 'testTitle1', price: 1, count: 1 };
const testRecord2 = { title: 'testTitle2', price: 2, count: 2 };
const wrongTestRecord1 = { title: 'testTitle3', price: -3, count: 3 };

const getRecords = (testRecords) => testRecords.map((record) => ({ body: JSON.stringify(record) }));

describe('catalogBatchProcess', () => {
  test('should create records inside Dynamo DB', async () => {
    const testRecords = [testRecord1, testRecord2];
    const eventStub = { Records: getRecords(testRecords) };

    const dynamoDbClientSendSpy = jest.fn().mockResolvedValue({ $metadata: { httpStatusCode: 200 } });
    jest.spyOn(getDBDocumentClient, 'default').mockImplementation(() => ({ send: dynamoDbClientSendSpy }));

    await catalogBatchProcess(eventStub);

    expect(dynamoDbClientSendSpy).toHaveBeenCalledTimes(testRecords.length);
    expect(dynamoDbClientSendSpy.mock.calls[0][0]).toMatchInlineSnapshot(`TransactWriteCommand {}`);
  });

  test('should create send messages to SNS service', async () => {
    const testRecords = [testRecord1, testRecord2];
    const eventStub = { Records: getRecords(testRecords) };

    const dynamoDbClientSendSpy = jest.fn().mockResolvedValue({ $metadata: { httpStatusCode: 200 } });
    jest.spyOn(getDBDocumentClient, 'default').mockImplementation(() => ({ send: dynamoDbClientSendSpy }));

    const snsSendSpy = jest.fn();
    SNSClient.mockReturnValue({ send: snsSendSpy });

    await catalogBatchProcess(eventStub);

    expect(snsSendSpy).toHaveBeenCalledTimes(testRecords.length);
    testRecords.forEach((record, index) => {
      expect(PublishCommand.mock.calls[index][0]).toMatchSnapshot();
    })
  });

  test('should create send error message to SNS service', async () => {
    const testRecords = [testRecord1, testRecord2, wrongTestRecord1];
    const eventStub = { Records: getRecords(testRecords) };

    const dynamoDbClientSendSpy = jest.fn().mockResolvedValue({ $metadata: { httpStatusCode: 500 } });
    jest.spyOn(getDBDocumentClient, 'default').mockImplementation(() => ({ send: dynamoDbClientSendSpy }));

    const snsSendSpy = jest.fn();
    SNSClient.mockReturnValue({ send: snsSendSpy });

    await catalogBatchProcess(eventStub);

    expect(snsSendSpy).toHaveBeenCalledTimes(1);
    expect(PublishCommand.mock.calls[0][0]).toMatchSnapshot();
  });
});
