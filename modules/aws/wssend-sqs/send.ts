import {SQSEvent, SQSHandler} from 'aws-lambda';
import {PutObjectCommand, S3} from "@aws-sdk/client-s3";
import {DeleteItemCommand, DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {QueryCommand, QueryCommandInput, QueryCommandOutput} from "@aws-sdk/lib-dynamodb";
import {ApiGatewayManagementApi, PostToConnectionCommand} from "@aws-sdk/client-apigatewaymanagementapi";


const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});

const apiGatewayClient: ApiGatewayManagementApi = new ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_API_ENDPOINT
});
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const tenantId = '986922ea-0eb2-4ca4-ab88-904021866c3b';

export const lambdaHandler: SQSHandler = async (event: SQSEvent) => {
    try {
        for (const record of event.Records) {
            const message: string = record.body;
            const body = (JSON.parse(message));

            console.log(body);

            await sendUpdate(body, tenantId);
        }
        return;
    } catch
        (error: any) {
        // Send to Dead Letter Queue (DLQ) if there's an error
        // You need to configure DLQ in the SQS queue settings
        throw new Error(`Error processing SQS message: ${error.message}`);
    }
};

const sendUpdate = async (body: any, tenantId: string) =>{
    console.log(tenantId);
    const dbName: string | undefined = process.env.CONNECTION_TABLE;
    console.log(dbName);
    const params: QueryCommandInput = {
        TableName: dbName,
        KeyConditionExpression: 'tenantId = :pkValue',
        ExpressionAttributeValues: {
            ':pkValue': tenantId,
        },
    };
    console.log(params);
    console.log('pre');
    console.log('postpre');
    try{
        const results: QueryCommandOutput = await ddbClient.send(new QueryCommand(params));
        console.log('post')
        console.log(`Results: ${JSON.stringify(results,null,2)}`);
        if (results.Items)
            for (const item of results.Items) {
                try {
                    console.log(item);
                    await apiGatewayClient.send(new PostToConnectionCommand({
                        ConnectionId: item.connectionId,
                        Data: JSON.stringify(body)
                    }));
                } catch (error: any) {
                    console.error(`Error sending message TO ${item.connectionId}:`, JSON.stringify(error,null,2));
                    console.log(error.name);
                    console.log(JSON.stringify(error, null, 2));
                    if (error.name === "GoneException") { // Check if the connection ID is no longer valid
                        console.log(`Deleting stale connection ID: ${item.connectionId}`);
                        deleteConnectionId(item.connectionId, tenantId!,  dbName!);
                    } else {
                        console.error("Error sending message:", error);
                    }
                    // Handle disconnections or other errors here, e.g., delete stale connection IDs from DynamoDB
                }
            }
    }catch(error: any){
        console.log(error);
    }

}

function deleteConnectionId(connectionId: string, tenantId: string, dbName: string) {
    const deleteParams = {
        TableName: dbName,
        Key: {
            "connectionId": { S: connectionId },
            "tenantId": {S: tenantId }
        }
    };
    try {
        ddbClient.send(new DeleteItemCommand(deleteParams));
    } catch (error) {
        console.error("Error deleting connection ID from DynamoDB:", error);
        throw error;
    }
}

