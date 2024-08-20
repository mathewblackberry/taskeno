import {APIGatewayProxyResult} from 'aws-lambda';
import {v4 as uuid} from 'uuid';
import {
    DeleteCommand,
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
    SK_PREFIX: string, baseIndex: number, role: string): Promise<APIGatewayProxyResult> => {
    try {
        const tenantId: string = pathParameters[0];
        const parentId: string = baseIndex === -1 ? '' : pathParameters[baseIndex];
        if (!tenantId) throw new InputValidationError('Tenant Id not provided');
        if (parentId == null) throw new InputValidationError('Incorrectly formed request');
        switch (method) {
            case 'POST':
                if (role === 'admin' || SK_PREFIX === 'comment') {
                    return await handleCreateRequest(body, tenantId, parentId, TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX);
                } else {
                    return {statusCode: 403, body: JSON.stringify({message: 'Forbidden'})};
                }
            case 'GET':
                return await handleGetRequest(pathParameters, TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX, baseIndex, role);
            case 'PUT':
                if (role === 'admin' || SK_PREFIX === 'comment') {
                    return await handleUpdateRequest(body, tenantId, parentId, pathParameters[baseIndex + 2], TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX);
                } else {
                    return {statusCode: 403, body: JSON.stringify({message: 'Forbidden'})};
                }
            case 'DELETE':
                if (role !== 'admin')
                    return {statusCode: 403, body: JSON.stringify({message: 'Forbidden'})};
                return await handleDeleteRequest(tenantId, parentId, pathParameters[baseIndex + 2], TABLE_NAME, ddbClient, PK_PREFIX, SK_PREFIX);
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
    let id = uuid();
    if (SK_PREFIX === 'COMMENT#')
        id = new Date().toISOString();

    let skId = id;
    if (tenantId === '0' && parentId === '') {
        tenantId = id;
        parentId = id;
        skId = '';
    }
    body.id = id;
    const store = {
        pk: `${PK_PREFIX}${parentId}`,
        sk: `${SK_PREFIX}${skId}`,
        tenantId: tenantId,
        name: body.name ? body.name : body.hostname,
        id: id,
        data: body
    };

    const putParams: PutCommandInput = {
        TableName: TABLE_NAME,
        Item: store
    };
    try {
        await ddbClient.send(new PutCommand(putParams));
    } catch (err) {
        console.log(err);
    }
    return {statusCode: 200, body: JSON.stringify({id})};
};

const handleGetRequest = async (pathParameters: string[], TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string, baseIndex: number, role: string): Promise<APIGatewayProxyResult> => {
    if (pathParameters.length === baseIndex + 2) {
        const params: QueryCommandInput = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pkValue AND begins_with(sk, :skPrefix)',
            ExpressionAttributeValues: {
                ':pkValue': `${PK_PREFIX}${pathParameters[baseIndex]}`,
                ':skPrefix': SK_PREFIX
            }
        };

        const results: QueryCommandOutput = await ddbClient.send(new QueryCommand(params));
        let out = results.Items?.filter(item => item.tenantId === pathParameters[0]).map(item => item.data);

        if (role !== 'admin') {
            out = removeFields(out, ['password'])
        }

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

    if (role !== 'admin') {
        data.Item.data = removeFields(data.Item.data, ['password'])
    }

    if (data.Item.tenantId !== pathParameters[0]) {
        throw new Error('Item not found');
    }
    return {statusCode: 200, body: JSON.stringify(data.Item.data)};
};

const handleUpdateRequest = async (body: any, tenantId: string, parentId: string, skId: string, TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string): Promise<APIGatewayProxyResult> => {
    if (!body || Object.keys(body).length === 0) {
        throw new InputValidationError('Invalid body content');
    }

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
            throw new Error('Could not save item');
        }
    }

    return {statusCode: 200, body: JSON.stringify({message: 'Update completed successfully'})};
};

const handleDeleteRequest = async (
    tenantId: string, parentId: string, skId: string,
    TABLE_NAME: string, ddbClient: DynamoDBClient, PK_PREFIX: string, SK_PREFIX: string
): Promise<APIGatewayProxyResult> => {
    if (!tenantId || !parentId || !skId) {
        throw new InputValidationError('Missing required parameters');
    }

    const deleteParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `${PK_PREFIX}${parentId}`,
            sk: `${SK_PREFIX}${skId}`
        },
        ConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
            ':tenantId': tenantId
        }
    };

    try {
        await ddbClient.send(new DeleteCommand(deleteParams));
        return {statusCode: 200, body: JSON.stringify({message: 'Item deleted successfully'})};
    } catch (error: any) {
        console.error(`Error deleting item: ${JSON.stringify(error, null, 2)}`);
        if (error.name === 'ConditionalCheckFailedException') {
            return {statusCode: 404, body: JSON.stringify({message: 'Item not found or unauthorized'})};
        }
        return handleError(error);
    }
};

const removeFields = (obj: any, fieldsToRemove: string[]): any => {
    if (Array.isArray(obj)) {
        return obj.map(item => removeFields(item, fieldsToRemove));
    } else if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key of Object.keys(obj)) {
            if (!fieldsToRemove.includes(key)) {
                newObj[key] = removeFields(obj[key], fieldsToRemove);
            }
        }
        return newObj;
    } else {
        return obj;
    }
};

const handleError = (error: any): APIGatewayProxyResult => {
    console.error('Error:', error);
    if (error instanceof InputValidationError) return {statusCode: 406, body: JSON.stringify({message: error.message})};
    else if (error instanceof ResourceNotFoundException) return {statusCode: 404, body: ''};
    else return {statusCode: 500, body: JSON.stringify({message: 'Internal server error'})};
};
