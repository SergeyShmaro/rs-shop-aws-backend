import type { APIGatewayIAMAuthorizerResult, APIGatewayRequestIAMAuthorizerHandlerV2 } from 'aws-lambda';

const parseAuthToken = (authToken: unknown): { userName: string; password: string } | null => {
  if (typeof authToken !== 'string') return null;

  const decodedToken = Buffer.from(authToken, 'base64').toString('ascii');
  const [userName, password] = decodedToken.split(':');

  if (!userName || !password) return null;

  return { userName, password };
};

const getAuthorizerOutput = (action: 'Allow' | 'Deny', arn: string, userName?: string): APIGatewayIAMAuthorizerResult => {
  return {
    principalId: userName ?? 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: action,
          Resource: arn,
        },
      ],
    },
  };
};

export const basicAuthorizer: APIGatewayRequestIAMAuthorizerHandlerV2 = async (event) => {
  try {
    const [authHeaderValue] = event.identitySource;
    const [authType, authToken] = authHeaderValue.split(' ');
    if (typeof authType !== 'string' || authType.toLowerCase() !== 'basic') return getAuthorizerOutput('Deny', event.routeArn);

    const tokenData = parseAuthToken(authToken);
    if (!tokenData) return getAuthorizerOutput('Deny', event.routeArn);

    const { userName, password } = tokenData;
    const isPasswordCorrect = process.env[userName] === password;
    if (!isPasswordCorrect) return getAuthorizerOutput('Deny', event.routeArn);

    return getAuthorizerOutput('Allow', event.routeArn, userName);
  } catch (e) {
    console.log('Internal server error appeared', e);
    return getAuthorizerOutput('Deny', event.routeArn);
  }
};
