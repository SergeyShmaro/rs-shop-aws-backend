import type { S3Handler } from 'aws-lambda';
import csv from 'csv-parser';
import type { GetObjectCommandOutput } from '@aws-sdk/client-s3';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, REGION } from 'src/constants/environment';

const getFileName = (key: string) => {
  const splittedKey = key.split('/');
  const fileNameWithExtension = splittedKey[splittedKey.length - 1];
  if (fileNameWithExtension.indexOf('.csv') === -1) return undefined;
  return fileNameWithExtension;
};

const getProductsData = (getObjectResponse: GetObjectCommandOutput) => {
  return new Promise((resolve) => {
    const results = [];
    getObjectResponse.Body
      ?.pipe(csv({ separator: '\t' }))
      ?.on('data', (data) => results.push(data))
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

    const productsData = await getProductsData(getObjectResponse);
    console.log('productsData', productsData);

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
