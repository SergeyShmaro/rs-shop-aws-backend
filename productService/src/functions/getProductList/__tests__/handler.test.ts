import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import productList from 'src/constants/productList';
import { getProductList } from 'src/functions/getProductList/handler'

describe('getProductList handler', () => {
  // @ts-expect-error event is not fully mocked
  const eventMock: APIGatewayProxyEventV2 = {};
  // @ts-expect-error context is not fully mocked
  const contextMock: Context = {};

  test('should return all produts', async () => {
    const handlerResult = await getProductList(eventMock, contextMock, () => { });
    expect(handlerResult).toEqual(productList);
  });
});