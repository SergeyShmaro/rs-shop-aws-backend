import type { AWS } from '@serverless/typescript';

const serverlessConfiguration: AWS = {
  service: 'productservice',
  frameworkVersion: '3',
  plugins: ['serverless-auto-swagger', 'serverless-esbuild', 'serverless-offline'],
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
        {
          httpApi: {
            method: 'GET',
            path: '/products',
            // @ts-expect-error types for serverless-auto-swagger don't exist
            responseData: {
              200: {
                description: 'Returns the list of available products.',
                bodyType: 'ProductList',
              },
            }
          }
        }
      ]
    },
    getProductById: {
      handler: 'src/functions/getProductById/handler.getProductById',
      description: 'Retrieves product with provided productId',
      events: [
        {
          httpApi: {
            method: 'GET',
            path: '/products/{productId}',
            // @ts-expect-error types for serverless-auto-swagger don't exist
            responseData: {
              200: {
                description: 'Returns product with provided productId.',
                bodyType: 'Product',
              },
              400: {
                description: `Returned when provided productId have wrong format (UUID format is expected).`,
              },
              404: {
                description: `Returned when product with provided productId is not found.`,
              },
            }
          }
        }
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
    autoswagger: {
      title: 'Product service API',
      apiType: 'httpApi',
      generateSwaggerOnDeploy: true,
      typefiles: ['./src/types/product.ts'],
      basePath: '',
      schemes: ['https', 'http'],
    }
  },
};

module.exports = serverlessConfiguration;
