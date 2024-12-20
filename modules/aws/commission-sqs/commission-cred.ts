import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DeleteMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {DynamoDBDocumentClient, GetCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {SQSHandler} from 'aws-lambda';
import axios from "axios";
import {randomBytes} from "crypto";
import https from 'https';
import {Asset, RouterDetails, Credential} from '../assetmanager/model';

const sqsClient = new SQSClient({region: process.env.AWS_REGION});

const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const RADIUS_SECRET: string = process.env.RADIUS_SECRET!;
const RADIUS_SERVER: string = process.env.RADIUS_SERVER!;

const getAsset = async (siteId: string, assetId: string): Promise<Asset | null> => {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        }
    };

    try {
        const data = await docClient.send(new GetCommand(params));
        return data.Item?.data as Asset | null;
    } catch (err) {
        console.error("Error retrieving asset:", err);
        return null;
    }
};

const loginWithCredentials = async (apiUrl: string, credentials: Credential, caCert: Buffer) => {
    const httpsAgent = new https.Agent({
        ca: caCert,
        keepAlive: true,
        keepAliveMsecs: 1000
    });

    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        },
        httpsAgent,
        timeout: 5000
    };

    try {
        // Attempt to get users to verify login
        const response = await axios.get(`${apiUrl}/user`, config);
        return {config, success: true};
    } catch (err) {
        console.log(err);
        return {config, success: false};
    }
};

const updateCredentialsOnRouter = async (fqdn: string, routerDetails: RouterDetails, newCredentials: Credential[]) => {
    const apiUrl = `https://${fqdn}/rest`;

    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        console.error("Custom CA certificate not provided");
        return;
    }
    const caCert = Buffer.from(caCertBase64, 'base64');

    const httpsAgent = new https.Agent({
        ca: caCert
    });

    let config: any;
    let success: boolean = false;

    const newCredential = routerDetails.credentials.find(c => c.username === 'api');
    if (newCredential) {
        console.log("Trying new credentials");
        ({config, success} = await loginWithCredentials(apiUrl, newCredential, caCert));
    }

    // If login fails with new credentials, fall back to default credentials
    if (!success) {
        console.log("New credentials failed, trying default credentials");
        const defaultCredential: Credential = {username: 'api', password: process.env.DEFAULT_API_PASSWORD!};
        ({config, success} = await loginWithCredentials(apiUrl, defaultCredential, caCert));

        if (!success) {
            console.error("Both new and default credentials failed");
            return;
        }

        // Update routerDetails.defaultCredentials with default credentials
        // routerDetails.defaultCredentials = defaultCredential;
    }

    for (const credential of newCredentials) {
        try {
            // Check if the credential exists
            const response = await axios.get(`${apiUrl}/user`, config);
            // console.log('get');
            const users = response.data;
            // console.log(users);
            const existingUser = users.find((user: any) => user.name === credential.username);

            if (existingUser) {
                // Update user password
                console.log(`Updating User: `)
                await axios.patch(`${apiUrl}/user/${existingUser['.id']}`, {password: credential.password, group: credential.username === 'admin' ? 'full' : credential.username}, config);
            } else {
                console.log(`Adding User: `);
                // Add new user
                await axios.put(`${apiUrl}/user`, {name: credential.username, password: credential.password, group: credential.username === 'admin' ? 'full' : credential.username}, config);
            }
        } catch (err) {
            console.error(`Error updating/adding user ${credential.username}:`, err);
        }
    }
};

const saveCredentialsToDynamoDB = async (siteId: string, assetId: string, data: Asset) => {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        },
        UpdateExpression: "set #data = :data",
        ExpressionAttributeValues: {
            ":data": data
        },
        ExpressionAttributeNames: {
            '#data': 'data'
        }
    };

    try {
        await docClient.send(new UpdateCommand(params));
    } catch (err) {
        console.error("Error saving credentials to DynamoDB:", err);
    }
};

const addOrUpdateRadiusServer = async (fqdn: string, radiusIp: string, router: Asset) => {
    const apiUrl = `https://${fqdn}/rest`;

    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        console.error("Custom CA certificate not provided");
        return;
    }
    const caCert = Buffer.from(caCertBase64, 'base64');

    const httpsAgent = new https.Agent({
        ca: caCert
    });

    let config: any;
    let success: boolean = false;

    const newCredential = router.routerDetails!.credentials.find(c => c.username === 'api');
    if (newCredential) {
        console.log("Trying new credentials");
        ({config, success} = await loginWithCredentials(apiUrl, newCredential, caCert));
    }

    // If login fails with new credentials, fall back to default credentials
    if (!success) {
        console.log("New credentials failed, trying default credentials");
        const defaultCredential: Credential = {username: 'api', password: process.env.DEFAULT_API_PASSWORD!};
        ({config, success} = await loginWithCredentials(apiUrl, defaultCredential, caCert));

        if (!success) {
            console.error("Both new and default credentials failed");
            return;
        }

        // Update routerDetails.defaultCredentials with default credentials
        // routerDetails.defaultCredentials = defaultCredential;
    }

    try {
        // Fetch existing RADIUS servers
        const response = await axios.get(`${apiUrl}/radius`, config);
        const radiusServers = response.data;

        // Check if the RADIUS server already exists
        const existingServer = radiusServers.find((server: any) => server.address === radiusIp);

        if (existingServer) {
            // Update the existing RADIUS server
            await axios.patch(`${apiUrl}/radius/${existingServer['.id']}`, {
                address: radiusIp,
                service: "login",
                timeout: "30s",
                secret: RADIUS_SECRET,
                'src-address': router.loopbacks[0]
            }, config);
            console.log(`Updated RADIUS server at ${radiusIp}`);
        } else {
            // Add a new RADIUS server
            await axios.put(`${apiUrl}/radius`, {
                address: radiusIp,
                service: "login",
                timeout: "30s",
                secret: RADIUS_SECRET,
                'src-address': router.loopbacks[0]
            }, config);
            console.log(`Added new RADIUS server at ${radiusIp}`);
        }
    } catch (err) {
        console.error("Error adding/updating RADIUS server:", err);
        throw err;
    }
};

const generateRandomPassword = (length: number): string => {
    return randomBytes(length).toString('base64').slice(0, length);
};

const getRouterSerialNumber = async (fqdn: string, routerDetails: RouterDetails): Promise<string | null> => {
    const apiUrl = `https://${fqdn}/rest`;

    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        console.error("Custom CA certificate not provided");
        return null;
    }
    const caCert = Buffer.from(caCertBase64, 'base64');

    const httpsAgent = new https.Agent({
        ca: caCert
    });

    let config: any;
    let success: boolean = false;

    const newCredential = routerDetails.credentials.find(c => c.username === 'api');
    if (newCredential) {
        ({config, success} = await loginWithCredentials(apiUrl, newCredential, caCert));
    }

    try {
        // Perform the HTTPS request to the RouterOS REST API using basic auth
        const response = await axios.get(`${apiUrl}/system/routerboard`, config);

        // The response data contains the RouterOS system details
        const data = response.data;
        // Find and return the serial-number from the response data
        if (data && data['serial-number']) {
            return data['serial-number'];
        }
        return null; // Return null if serial number is not found
    } catch
        (error) {
        console.error('Error retrieving serial number:', error);
        return null;
    }
}

const saveSerialToDynamoDB = async (siteId: string, assetId: string, data: Asset, serialNumber: string) => {
    if (data.routerDetails)
        data.routerDetails.serialNumber = serialNumber;
    const params = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        },
        UpdateExpression: "set #data = :data",
        ExpressionAttributeValues: {
            ":data": data
        },
        ExpressionAttributeNames: {
            '#data': 'data'
        }
    };

    try {
        await docClient.send(new UpdateCommand(params));
    } catch (err) {
        console.error("Error saving credentials to DynamoDB:", err);
    }
};

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const message = record.body;
        const receiptHandle = record.receiptHandle;
        const body = (JSON.parse(message));
        const {fqdn, siteId, assetId} = body;

        const asset = await getAsset(siteId, assetId);
        if (!asset || !asset.routerDetails) {
            console.error("Asset or router details not found");
            return;
        }

        const routerDetails = asset.routerDetails;
        const existingCredentials = routerDetails.credentials || [];
        // const newCredentials: Credential[] = [];

        // Ensure 'admin', 'api', and 'backup' users exist
        const requiredUsers = ['admin', 'api', 'backup'];
        for (const username of requiredUsers) {
            let credential = existingCredentials.find(c => c.username === username);
            if (!credential) {
                credential = {username, password: generateRandomPassword(username === 'backup' ? 64 : 24)};
                existingCredentials.push(credential);
            }
        }

        // Add or update credentials on the router
        await updateCredentialsOnRouter(fqdn, routerDetails, existingCredentials);

        //todo remove
        // const newCredential = routerDetails.credentials.find(c => c.username === 'api');
        // await AddLTEKeepalive(fqdn, newCredential!);

        // Save new credentials to DynamoDB
        await saveCredentialsToDynamoDB(siteId, assetId, asset);

        await addOrUpdateRadiusServer(fqdn, RADIUS_SERVER, asset);
        const serial = await getRouterSerialNumber(fqdn, routerDetails);
        if (serial)
            await saveSerialToDynamoDB(siteId, assetId, asset, serial);
        const deleteParams = {
            QueueUrl: process.env.QUEUE_URL!,
            ReceiptHandle: receiptHandle
        };

        try {
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
        } catch (error) {
            console.error('Error deleting SQS message:', error);
        }
    }
};

const AddLTEKeepalive = async (fqdn: string, credentials: Credential) => {
    const apiUrl = `https://${fqdn}/rest`;
    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        console.error("Custom CA certificate not provided");
        return;
    }
    const caCert = Buffer.from(caCertBase64, 'base64');

    const httpsAgent = new https.Agent({
        ca: caCert,
        keepAlive: true,
        keepAliveMsecs: 1000
    });

    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        },
        httpsAgent,
        timeout: 5000
    };

    try {

        const responseScript = await axios.get(`${apiUrl}/system/script`, config);
        const foundScript = responseScript.data.find((script: any) => script.name === 'lte-keepalive');
        if (foundScript) {
            await axios.patch(`${apiUrl}/system/script/${foundScript['.id']}`, {name: 'lte-keepalive', source: '/ping 10.37.221.221 interface=lte1 count=1'}, config);
        } else
            await axios.put(`${apiUrl}/system/script`, {name: 'lte-keepalive', source: '/ping 10.37.221.221 interface=lte1 count=1'}, config);

        const responseRoute = await axios.get(`${apiUrl}/ip/route`, config);

        const foundRoute = responseRoute.data.find((script: any) => script['dst-address'] === '10.37.221.221/32');
        if (foundRoute)
            await axios.patch(`${apiUrl}/ip/route/${foundRoute['.id']}`, {"dst-address": "10.37.221.221/32", gateway: "lte1"}, config);
        else
            await axios.put(`${apiUrl}/ip/route`, {"dst-address": "10.37.221.221/32", gateway: "lte1"}, config);

        const responseSched = await axios.get(`${apiUrl}/system/scheduler`, config);
        const foundSched = responseSched.data.find((script: any) => script.name === 'lte-keepalive');
        if (foundSched)
            await axios.patch(`${apiUrl}/system/scheduler/${foundSched['.id']}`, {name: "lte-keepalive", interval: "90s", "on-event": "lte-keepalive"}, config);
        else
            await axios.put(`${apiUrl}/system/scheduler`, {name: "lte-keepalive", interval: "30s", "on-event": "lte-keepalive"}, config);

    } catch (err) {
        console.log(err);
        return {config, success: false};
    }
}
