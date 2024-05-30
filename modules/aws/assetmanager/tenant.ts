import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import {processKenoChildRequest} from './tenant.child';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const TABLE_NAME: string = process.env.DYNAMODB_ASSOCIATION_TABLE!;
export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const response: APIGatewayProxyResult = {statusCode: 200, body: '', headers: {'Access-Control-Allow-Origin': '*'}};
    let pathComponents: string[] = [];
    if (event.pathParameters?.proxy) {
        pathComponents = event.pathParameters.proxy.split('/').filter(Boolean);
    }
    const body = JSON.parse(event.body!);
    if ((pathComponents.length >= 2)) {
        if (pathComponents[1] === 'tenant'){
            console.log('new tenant');
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'TENANT',-1)};
        }
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'asset'))
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'SITE#', 'ASSET#',2)};
        else if (pathComponents[1] === 'site')
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'SITE#',0)};


    }


    if (!event.body) {
        response.statusCode = 400;
        response.body = JSON.stringify({message: event});
        return response;
    }
    response.body = JSON.stringify({message: 'It works! Well done!'});
    return response;
};
