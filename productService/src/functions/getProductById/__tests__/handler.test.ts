import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import productList from 'src/dbPatches/initialData/productList';
import { getProductById } from 'src/functions/getProductById/handler'

const getEventMock = (productId?: string): APIGatewayProxyEventV2 => {
  // @ts-expect-error event is not fully mocked
  return { pathParameters: { productId } };
}

describe.skip('getProductById handler', () => {
  // @ts-expect-error event is not fully mocked
  const contextMock: Context = {};

  test('should return product by productId', async () => {
    const productId = productList[0].id;
    const eventMock = getEventMock(productId);
    const handlerResult = await getProductById(eventMock, contextMock, () => { });

    expect(handlerResult).toEqual(productList[0]);
  });

  describe('Wrong product id param', () => {
    const expectedResult = { body: 'Wrong productId parameter', statusCode: 400 };

    test('should return 400 status code and message when passed product id is empty', async () => {
      const productId = '';
      const eventMock = getEventMock(productId);
      const handlerResult = await getProductById(eventMock, contextMock, () => { });

      expect(handlerResult).toEqual(expectedResult);
    });

    test('should return 400 status code and message when passed product is not uuid', async () => {
      const productId = '123';
      const eventMock = getEventMock(productId);
      const handlerResult = await getProductById(eventMock, contextMock, () => { });

      expect(handlerResult).toEqual(expectedResult);
    });

    test('should return 400 status code and message when passed product is not uuid', async () => {
      const eventMock = getEventMock();
      const handlerResult = await getProductById(eventMock, contextMock, () => { });

      expect(handlerResult).toEqual(expectedResult);
    });
  });

  test('should return 404 status code and message when product with passed id is not found', async () => {
    const expectedResult = { body: 'Product with provided id was not found', statusCode: 404 };

    const productId = "7567ec4b-b10c-48c5-9345-fc73c48a80bb";
    const eventMock = getEventMock(productId);
    const handlerResult = await getProductById(eventMock, contextMock, () => { });

    expect(handlerResult).toEqual(expectedResult);
  });
});