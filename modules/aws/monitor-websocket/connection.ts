import {APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, PutCommand} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

interface DDBItem {
    tenantId: string;
    connectionId: string;
    expiry: number;
}

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (!event.queryStringParameters) {
        console.log('Missing Tenant Id');
        return {statusCode: 400, body: 'Missing query parameters'};
    }

    const {tenantId} = event.queryStringParameters;
    const connectionId = event.requestContext.connectionId;
    if (!tenantId || !connectionId) {
        return {statusCode: 400, body: 'Missing required parameters'};
    }
    const dbName: string | undefined = process.env.CONNECTION_TABLE;

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const ttl = now + 86400;

    const item: DDBItem = {
        tenantId: tenantId,
        connectionId: connectionId,
        expiry: ttl
    };

    try {
        await ddbDocClient.send(new PutCommand({
            TableName: dbName,
            Item: item
        }));
        return {statusCode: 200, body: 'Connection saved successfully'};
    } catch (err) {
        console.error(err);
        return {statusCode: 500, body: 'Internal Server Error'};
    }
};
