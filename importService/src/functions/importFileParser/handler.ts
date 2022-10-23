import type { S3Handler } from 'aws-lambda';
import csv from 'csv-parser';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, REGION } from 'src/constants/environment';

const getFileName = (key: string) => {
  const splittedKey = key.split('/');
  const fileNameWithExtension = splittedKey[splittedKey.length - 1];
  if (fileNameWithExtension.indexOf('.csv') === -1) return undefined;
  return fileNameWithExtension;
};

const sendDataToQueue = (sqsClient: SQSClient, data: any) => {
  if (typeof data !== 'object') return;
  if (typeof data.title !== 'string') return;
  if (data.imageSrc !== undefined && typeof data.imageSrc !== 'string') return false;
  if (data.description !== undefined && typeof data.description !== 'string') return false;
  const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
  if (typeof price !== 'number' || price <= 0) return;
  const count = typeof data.count === 'string' ? parseInt(data.count) : data.count;
  if (typeof count !== 'number' || count <= 0) return;

  sqsClient.send(new SendMessageCommand({
    QueueUrl: process.env.SQS_URL,
    MessageBody: JSON.stringify({
      price,
      count,
      title: data.title,
      imageSrc: data.imageSrc,
      description: data.description,
    }),
  }));

};

const processProductsData = (getObjectResponse: GetObjectCommandOutput): Promise<unknown[]> => {
  const sqsClient = new SQSClient({ region: 'eu-west-1' });

  return new Promise((resolve) => {
    const results = [];
    getObjectResponse.Body
      ?.pipe(csv({ separator: ';' }))
      ?.on('data', (data) => { sendDataToQueue(sqsClient, data); })
      ?.on('end', () => { resolve(results) });
  });
}

export const importFileParser: S3Handler = async (event) => {
  try {
    const createdObjectKey = event.Records?.[0]?.s3?.object?.key;
    if (!createdObjectKey) return;

    const s3Client = new S3Client({ region: REGION });

    const getObjectResponse = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: createdObjectKey,
    }));

    await processProductsData(getObjectResponse);

    const fileName = getFileName(createdObjectKey);
    if (!fileName) return;

    await s3Client.send(new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `parsed/${fileName}`,
      CopySource: `${BUCKET_NAME}/${createdObjectKey}`,
    }));

    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: createdObjectKey,
    }));
  } catch (e) {
    console.log('Internal server error appeared', e);
  }
};
