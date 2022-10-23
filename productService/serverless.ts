import type { AWS } from '@serverless/typescript';
import { PRODUCTS_TABLE, STOCKS_TABLE } from './src/constants/TableNames';

const serverlessConfiguration: AWS = {
  service: 'productservice',
  frameworkVersion: '3',
  plugins: ['serverless-auto-swagger', 'serverless-esbuild', 'serverless-offline'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: 'eu-west-1',
    environment: {
      PRODUCTS_TABLE,
      STOCKS_TABLE,
      CREATE_PRODUCT_TOPIC_ARN: { Ref: 'createProductTopic' },
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
            ],
            Resource: "*"
          },
          {
            Effect: 'Allow',
            Action: ['sns:*'],
            Resource: { Ref: 'createProductTopic' }
          },
        ],
      },
    },
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
              200: { description: 'Returns the list of available products.', bodyType: 'SProductList' },
              500: { description: 'Internal server error appeared' },
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
              200: { description: 'Returns product with provided productId.', bodyType: 'SProduct' },
              400: { description: `Returned when provided productId have wrong format (UUID format is expected).` },
              404: { description: `Returned when product with provided productId is not found.` },
              500: { description: 'Internal server error appeared' },
            }
          }
        }
      ]
    },
    createProduct: {
      handler: 'src/functions/createProduct/handler.createProduct',
      description: 'Creates new product',
      events: [
        {
          httpApi: {
            method: 'POST',
            path: '/products',
            // @ts-expect-error types for serverless-auto-swagger don't exist
            bodyType: 'SProductPayload',
            responseData: {
              200: { description: 'Returns id of created product', bodyType: 'SProductId' },
              400: { description: 'Provided product data has wrong format' },
              500: { description: 'Internal server error appeared' },
            }
          }
        }
      ]
    },
    catalogBatchProcess: {
      handler: 'src/functions/catalogBatchProcess/handler.catalogBatchProcess',
      description: 'Creates products imported from csv file',
      events: [
        {
          sqs: {
            arn: {
              "Fn::GetAtt": ['catalogItemsQueue', 'Arn'],
            },
            batchSize: 5,
          }
        }
      ]
    },
  },
  resources: {
    Resources: {
      DynamoDbProductsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
          TableName: PRODUCTS_TABLE,
        }
      },
      DynamoDbStocksTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [{ AttributeName: "productId", AttributeType: "S" }],
          KeySchema: [{ AttributeName: "productId", KeyType: "HASH" }],
          ProvisionedThroughput: { ReadCapacityUnits: 1, WriteCapacityUnits: 1 },
          TableName: STOCKS_TABLE,
        }
      },
      catalogItemsQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: "catalogItemsQueue"
        }
      },
      createProductTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'createProductTopic',
          Subscription: [
            { Protocol: 'email', Endpoint: '${env:CREATE_PRODUCT_EMAIL}' }
          ],
        }
      },
      expensiveProductsImportSub: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          TopicArn: { Ref: 'createProductTopic' },
          Endpoint: '${env:EXPENSIVE_PRODUCT_EMAIL}',
          FilterPolicy: { price: [{ "numeric": [">=", 50] }] },
          Protocol: 'email',
        }
      },
    }
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
      typefiles: ['./src/types/swaggerTypes.ts'],
      basePath: '',
      schemes: ['https', 'http'],
    }
  },
};

module.exports = serverlessConfiguration;
