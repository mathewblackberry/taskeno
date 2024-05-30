import {APIGatewayProxyResult} from 'aws-lambda';
import {v4 as uuid} from 'uuid';
import {
    GetCommand,
    GetCommandInput,
    GetCommandOutput,
    PutCommand,
    PutCommandInput,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    UpdateCommand,
    UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import {DynamoDBClient, ResourceNotFoundException} from '@aws-sdk/client-dynamodb';

export const processKenoChildRequest = async (
    method: string, body: any, pathParameters: string[],
    TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string,
    SK_PREFIX: string, baseIndex: number): Promise<APIGatewayProxyResult> => {
    console.log('a1');
    try {
        const tenantId: string = pathParameters[0];
        const parentId: string = baseIndex === -1 ? '' : pathParameters[baseIndex];
console.log('a2');
        if (!tenantId) throw new InputValidationError('Tenant Id not provided');
        if (parentId == null) throw new InputValidationError('Incorrectly formed request');
console.log('a3');
console.log(method);
        switch (method) {
            case 'POST':
                return await handleCreateRequest(body, tenantId, parentId, TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX);
            case 'GET':
                return await handleGetRequest(pathParameters, TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX, baseIndex);
            case 'PUT':
                return await handleUpdateRequest(body, tenantId, parentId, pathParameters[baseIndex + 2], TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX);
            case 'DELETE':
                return {statusCode: 405, body: JSON.stringify({message: 'Not allowed'})};
            default:
                return {statusCode: 400, body: JSON.stringify({message: 'Invalid operation'})};
        }
    } catch (error) {
        return handleError(error);
    }
};

class InputValidationError extends Error {
}

const handleCreateRequest = async (body: any, tenantId: string, parentId: string, TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string): Promise<APIGatewayProxyResult> => {
    if (!body || Object.keys(body).length === 0) {
        throw new InputValidationError('Invalid body content');
    }
    console.log('1');
    const id = uuid();
    let skId = id;
    if (tenantId === '0' && parentId === '') {
        tenantId = id;
        parentId = id;
        skId = '';
    }
    console.log('2');
    body.id = id;
    const store = {
        pk: `${PK_PREFIX}${parentId}`,
        sk: `${SK_PREFIX}${skId}`,
        tenantId: tenantId,
        name: body.name ? body.name : body.hostname,
        id: id,
        data: body
    };
    console.log(store);

    const putParams: PutCommandInput = {
        TableName: TABLE_NAME,
        Item: store
    };
    console.log('3');
    try {
        await ddbClient.send(new PutCommand(putParams));
    } catch (err) {
        console.log(err);
    }
    console.log('4');
    return {statusCode: 200, body: JSON.stringify({id})};
};

const handleGetRequest = async (pathParameters: string[], TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string, baseIndex: number): Promise<APIGatewayProxyResult> => {
    console.log(SK_PREFIX);
    if (pathParameters.length === baseIndex + 2 || pathParameters[3] === 'clubplayers') {
        const params: QueryCommandInput = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pkValue AND begins_with(sk, :skPrefix)',
            ExpressionAttributeValues: {
                ':pkValue': `${PK_PREFIX}${pathParameters[baseIndex]}`,
                ':skPrefix': SK_PREFIX
            }
        };

        const results: QueryCommandOutput = await ddbClient.send(new QueryCommand(params));
        const out = results.Items?.map(item => item.data);

        // if (PK_PREFIX === 'GRADE#' && SK_PREFIX === 'ROUND#')
        //     out?.forEach((r3: RoundPHQ) => {
        //         r3.games?.forEach((game: FixtureGamePHQ) => {
        //             delete game.password;
        //         });
        //     });
        return {statusCode: 200, body: JSON.stringify(out)};
    }

    const getParams: GetCommandInput = {
        TableName: TABLE_NAME,
        Key: {
            pk: `${PK_PREFIX}${pathParameters[baseIndex]}`,
            sk: `${SK_PREFIX}${pathParameters[baseIndex + 2]}`
        }
    };

    const data: GetCommandOutput = await ddbClient.send(new GetCommand(getParams));
    if (!data.Item) {
        throw new Error('Item not found');
    }

    // if (PK_PREFIX === 'GRADE#' && SK_PREFIX === 'ROUND#')
    //     (data.Item.data as RoundPHQ).games.forEach((game: FixtureGamePHQ) => {
    //         delete game.password;
    //     });

    return {statusCode: 200, body: JSON.stringify(data.Item.data)};
};

const handleUpdateRequest = async (body: any, tenantId: string, parentId: string, skId: string, TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string): Promise<APIGatewayProxyResult> => {
    if (!body || Object.keys(body).length === 0) {
        throw new InputValidationError('Invalid body content');
    }

    // if (PK_PREFIX === 'GRADE#' && SK_PREFIX === 'ROUND#')
    //     (body as RoundPHQ).games?.forEach((game: FixtureGamePHQ) => {
    //         if (game.password === undefined) game.password = 1234;
    //     });

    const params: UpdateCommandInput = {
        TableName: TABLE_NAME,
        Key: {
            pk: `${PK_PREFIX}${parentId}`,
            sk: `${SK_PREFIX}${skId}`
        },
        UpdateExpression: 'set #data = :data, #name = :name, #id = :id',
        ConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
            ':data': body,
            ':name': body.name ? body.name : body.hostname,
            ':id': body.id,
            ':tenantId': tenantId
        },
        ExpressionAttributeNames: {
            '#data': 'data',
            '#name': 'name',
            '#id': 'id'

        },
        ReturnValues: 'ALL_NEW'
    };

    try {
        await ddbClient.send(new UpdateCommand(params));
    } catch (error: any) {
        console.log(`Error Occurred: ${JSON.stringify(error, null, 2)}`);
        if (error.name === 'ConditionalCheckFailedException') {
            console.log('Trying Put');
        }
        try {
            const store = {
                pk: `${PK_PREFIX}${parentId}`,
                sk: `${SK_PREFIX}${skId}`,
                tenantId: tenantId,
                name: body.name ? body.name : `${body.lastName}, ${body.firstName}`,
                id: body.id,
                data: body
            };

            const putParams: PutCommandInput = {
                TableName: TABLE_NAME,
                Item: store
            };
            const putResult = await ddbClient.send(new PutCommand(putParams));
            console.log('PutItem succeeded:', putResult);
        } catch (putError) {
            throw new Error('Could not save Club Player');
        }
    }

    return {statusCode: 204, body: ''};
};

const handleError = (error: any): APIGatewayProxyResult => {
    console.error('Error:', error);
    if (error instanceof InputValidationError) return {statusCode: 406, body: JSON.stringify({message: error.message})};
    else if (error instanceof ResourceNotFoundException) return {statusCode: 404, body: ''};
    else return {statusCode: 500, body: JSON.stringify({message: 'Internal server error'})};
};
