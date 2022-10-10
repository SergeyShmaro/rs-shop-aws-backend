import type { AWS } from '@serverless/typescript';
import { BUCKET_NAME } from './src/constants/environment';

const serverlessConfiguration: AWS = {
  service: 'importservice',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'eu-west-1',
    environment: {
      SQS_URL: '${env:SQS_URL}',
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: "arn:aws:s3:::e-shop-rs-import/*"
          },
          {
            Effect: 'Allow',
            Action: ['sqs:*'],
            Resource: '${env:SQS_ARN}'
          }
        ],
      },
    },
    httpApi: { cors: true, shouldStartNameWithService: true },
  },
  functions: {
    importProductsFile: {
      handler: 'src/functions/importProductsFile/handler.importProductsFile',
      description: 'Saves .csv file into s3 bucket',
      events: [{ httpApi: { method: 'GET', path: '/import' } }],
    },
    importFileParser: {
      handler: 'src/functions/importFileParser/handler.importFileParser',
      description: 'Parse the file created in s3 bucket',
      events: [
        {
          s3: {
            bucket: BUCKET_NAME,
            event: 's3:ObjectCreated:*',
            rules: [{ prefix: 'uploaded/' }, { suffix: '.csv' }]
          }
        }
      ],
    },
  },
  custom: {
    esbuild: {
      bundle: true,
      minify: true,
      sourcemap: false,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
