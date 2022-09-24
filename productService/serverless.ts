import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'productservice',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'eu-west-1',
    httpApi: {
      cors: true,
      shouldStartNameWithService: true,
    },
  },
  functions: {
    getProductList: {
      handler: 'src/functions/getProductList/handler.getProductList',
      description: 'Retrieves list of available products',
      events: [
        { httpApi: 'GET /products' }
      ]
    },
    getProductById: {
      handler: 'src/functions/getProductById/handler.getProductById',
      description: 'Retrieves product by provided product ID',
      events: [
        { httpApi: 'GET /products/{productId}' }
      ]
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
