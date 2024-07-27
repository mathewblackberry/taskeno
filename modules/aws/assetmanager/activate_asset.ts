import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {UpdateCommand, UpdateCommandInput} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';

const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;

export const activateAsset = async (pathParameters: string[], activate: boolean): Promise<APIGatewayProxyResult> => {

    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    if (!tenantId || !siteId || !assetId) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: 'Invalid Request'})
        };
    }

    try {
        // First update: SITE#<siteid> and ASSET#<assetid>
        const updateSiteAssetParams: UpdateCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                pk: `SITE#${siteId}`,
                sk: `ASSET#${assetId}`
            },
            UpdateExpression: 'SET #data.#active = :active',
            ExpressionAttributeNames: {
                '#data': 'data',
                '#active': 'active'
            },
            ExpressionAttributeValues: {
                ':active': activate
            },
            ReturnValues: 'ALL_NEW'
        };

        // Second update: TENANT#<tenantId> and SITE#<siteid>
        const updateTenantSiteParams: UpdateCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                pk: `TENANT#${tenantId}`,
                sk: `SITE#${siteId}`
            },
            UpdateExpression: 'SET #data.#active = :active',
            ExpressionAttributeNames: {
                '#data': 'data',
                '#active': 'active'
            },
            ExpressionAttributeValues: {
                ':active': activate
            },
            ReturnValues: 'ALL_NEW'
        };

        // Execute both updates
        const [updateSiteAssetResult, updateTenantSiteResult] = await Promise.all([
            ddbClient.send(new UpdateCommand(updateSiteAssetParams)),
            ddbClient.send(new UpdateCommand(updateTenantSiteParams))
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Updates successful',
                updateSiteAssetResult,
                updateTenantSiteResult
            })
        };
    } catch (error) {
        console.log(error);
        console.error('Error updating DynamoDB', error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Error updating DynamoDB'})
        };
    }
};
