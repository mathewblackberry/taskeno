import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {UpdateCommand, UpdateCommandInput, PutCommand, PutCommandInput, GetCommandInput, GetCommand, QueryCommandInput, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';
import {Rate} from './model';

const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;

export const activateAsset = async (pathParameters: string[], activate: boolean, body: any): Promise<APIGatewayProxyResult> => {
    // console.log(1);
    // console.log(body);
    // body = JSON.parse(body);
    // console.log(2);
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];
    const eventType = activate ? 'ACTIVATED' : 'DEACTIVATED';
    const eventTimestamp = body.timestamp;
    const rate: Rate = body.rate;

    if (!tenantId || !siteId || !assetId) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: 'Invalid Request'})
        };
    }

    try {

        const getSiteAssetParams: GetCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                pk: `SITE#${siteId}`,
                sk: `ASSET#${assetId}`
            }
        };

        const siteAssetResult = await ddbClient.send(new GetCommand(getSiteAssetParams));
        const currentActive = siteAssetResult.Item?.data?.active;

        // If the current active status is the same as the new one, return without making updates
        if (currentActive === activate) {
            return {
                statusCode: 200,
                body: JSON.stringify({message: 'No changes made as the active status is already up-to-date.'})
            };
        }

        const getLastEventParams: QueryCommandInput = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pkValue AND sk < :newEventTimestamp',
            ExpressionAttributeValues: {
                ':pkValue': `ASSET#${assetId}`,
                ':newEventTimestamp': `EVENT#${eventTimestamp}`
            },
            ScanIndexForward: false, // To get the most recent event before the new timestamp
            Limit: 1
        };

        const lastEventResult = await ddbClient.send(new QueryCommand(getLastEventParams));
        const lastEvent = lastEventResult.Items?.[0];

        if (lastEvent) {

            if (lastEvent && lastEvent.sk.startsWith('EVENT#')) {
                const lastEventType = lastEvent.eventType;
                if ((activate && lastEventType !== 'DEACTIVATED') || (!activate && lastEventType !== 'ACTIVATED')) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({message: `Cannot change state. Expected last event before the new timestamp to be ${activate ? 'DEACTIVATED' : 'ACTIVATED'}.`, json: lastEvent})
                    };
                }
            }
        }

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

        // Add new event based on the activate parameter

        const addEventParams: PutCommandInput = {
            TableName: TABLE_NAME,
            Item: {
                pk: `ASSET#${assetId}`,
                sk: `EVENT#${eventTimestamp}`,
                eventType: eventType,
                timestamp: eventTimestamp,
                rate: rate
            }
        };

        // Execute both updates and event creation
        // const [updateSiteAssetResult, updateTenantSiteResult, addEventResult] = await Promise.all([
        //     ddbClient.send(new UpdateCommand(updateSiteAssetParams)),
        //     ddbClient.send(new UpdateCommand(updateTenantSiteParams)),
        //     ddbClient.send(new PutCommand(addEventParams))
        // ]);


        const promises = [
            ddbClient.send(new UpdateCommand(updateSiteAssetParams))
        ];

        if (activate) {
            promises.push(ddbClient.send(new UpdateCommand(updateTenantSiteParams)));
        }

        promises.push(ddbClient.send(new PutCommand(addEventParams)));

// Execute all promises
        const [updateSiteAssetResult, updateTenantSiteResult, addEventResult] = await Promise.all(promises);



        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Updates and event creation successful',
                updateSiteAssetResult,
                updateTenantSiteResult,
                addEventResult
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
