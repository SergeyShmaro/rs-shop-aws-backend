import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

const expectedPresignedUrl = 'testUrl';
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: jest.fn().mockReturnValue(expectedPresignedUrl) }));
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/client-s3');
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { importProductsFile } from '../handler'

describe('importProductsFile', () => {
  // @ts-expect-error stub is not full
  const contextStub: Context = {};

  test('should return 400 status code when name query parameter is not passed', async () => {
    // @ts-expect-error stub is not full
    const eventStub: APIGatewayProxyEventV2 = { queryStringParameters: {} };
    const result = await importProductsFile(eventStub, contextStub, () => { });
    expect(result).toEqual({ body: "Provided file name is unacceptable", statusCode: 400 });
  });

  test('should return 400 status code when name query parameter is empty', async () => {
    // @ts-expect-error stub is not full
    const eventStub: APIGatewayProxyEventV2 = { queryStringParameters: { name: '' } };
    const result = await importProductsFile(eventStub, contextStub, () => { });
    expect(result).toEqual({ body: "Provided file name is unacceptable", statusCode: 400 });
  });

  test('should return 400 status code when name query parameter is contains not csv file', async () => {
    // @ts-expect-error stub is not full
    const eventStub: APIGatewayProxyEventV2 = { queryStringParameters: { name: 'asd.csv.txt' } };
    const result = await importProductsFile(eventStub, contextStub, () => { });
    expect(result).toEqual({ body: "Provided file name is unacceptable", statusCode: 400 });
  });

  test('should return signedUrl', async () => {
    // @ts-expect-error stub is not full
    const eventStub: APIGatewayProxyEventV2 = { queryStringParameters: { name: 'test.csv' } };
    const result = await importProductsFile(eventStub, contextStub, () => { });
    expect(result).toEqual(expectedPresignedUrl);
    expect(S3Client).toBeCalledTimes(1);
    expect(PutObjectCommand).toBeCalledTimes(1);
    expect(getSignedUrl).toBeCalledTimes(1);
  });
});
