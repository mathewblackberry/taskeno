import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {PutCommand} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';
import {v4 as uuidv4} from 'uuid';
import {Asset, RouterDetails} from './model';

const docClient = new DynamoDBClient({region: process.env.AWS_REGION});

export const createAsset = async (
    body: any,
    pathParameters: string[],
    TABLE_NAME: string
): Promise<APIGatewayProxyResult> => {
    // Extract the tenantId and siteId from path parameters
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const {hostname, serialNumber} = body;

    if (!hostname || !serialNumber) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: "Hostname and serial number are required."})
        };
    }

    // Validate and modify the hostname according to the specified pattern
    const hostnamePattern = /tko[a-z]{3}r[0-9]{2}mlt6$/;
    if (!hostnamePattern.test(hostname)) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: "Invalid hostname format."})
        };
    }

    // Modify the hostname as per the requirements
    const modifiedHostname = hostname.replace(/r[0-9]{2}/, 'm01').replace('mlt6', 'd167');

    // Create RouterDetails object with provided and default values
    const routerDetails: RouterDetails = {
        defaultCredentials: {
            username: 'admin', // Default username
            password: 'admin' // Default password
        },
        credentials: [
            {
                username: 'admin',
                password: 'admin',
                purpose: 'default'
            }
        ],
        serialNumber: serialNumber,
        model: 'Vigor167',
        manufacturer: 'Draytek'
    };

    // Create a new Asset object with minimal fields configured
    const assetId = uuidv4(); // Generate a unique ID for the asset
    const newAsset: Asset = {
        id: assetId,
        hostname: modifiedHostname,
        terminals: 0,
        lanSubnets: [],
        wanSubnets: [],
        loopbacks: [],
        carriageType: '',
        carriageFNN: '',
        carriagePort: '',
        FNN: '',
        POI: '',
        routerDetails: routerDetails,
        active: false
    };

    // Prepare the item to save to DynamoDB

    const params = {
        TableName: TABLE_NAME, // Replace with your DynamoDB table name
        Item: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`,
            data: newAsset,
            name: modifiedHostname,
            tenantId: tenantId,
            id: assetId
        }
    };

    console.log(JSON.stringify(params, null, 1));


    try {
        // Save the item to DynamoDB
        await docClient.send(new PutCommand(params));

        return {
            statusCode: 201,
            body: JSON.stringify(newAsset)
        };
    } catch (error) {
        console.error('Error saving to DynamoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: "Failed to save the asset."})
        };
    }
};
