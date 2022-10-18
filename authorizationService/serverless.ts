import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'authorizationservice',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'eu-west-1',
    environment: {
      SergeyShmaro: '${env:SergeyShmaro}',
    }
  },
  functions: {
    basicAuthorizer: {
      handler: 'src/functions/basicAuthorizer/handler.basicAuthorizer',
      description: 'Authorizer for API Gateway',
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
