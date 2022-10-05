import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME, REGION } from 'src/constants/environment';

const isCsvFile = (fileName: string) => fileName.lastIndexOf('.csv') === (fileName.length - '.csv'.length);

export const importProductsFile: APIGatewayProxyHandlerV2<string> = async (event) => {
  try {
    const { name } = event.queryStringParameters;
    if (typeof name !== 'string' || name === '' || !isCsvFile(name)) {
      return { statusCode: 400, body: 'Provided file name is unacceptable' };
    }

    const s3Client = new S3Client({ region: REGION });

    const command = new PutObjectCommand({ Bucket: BUCKET_NAME, Key: `uploaded/${name}` });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600, });
    return signedUrl;
  } catch (e) {
    console.log('Internal server error appeared', e);
    return { statusCode: 500, body: 'Internal server error appeared' };
  }
};
