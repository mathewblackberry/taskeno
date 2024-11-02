import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {GetObjectCommand, GetObjectCommandOutput, S3Client} from '@aws-sdk/client-s3';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {GetCommand, GetCommandInput, GetCommandOutput, ScanCommand, ScanCommandInput} from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import https from 'https';
import Redis from 'ioredis';
import {Readable} from 'stream';
import objectHash from "object-hash";
import {v4 as uuid} from 'uuid';
import {Asset, Credential, Glance, GlanceAsset, GlanceInterfaces} from './model';

const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const s3Client: S3Client = new S3Client({region: process.env.AWS_REGION});
const S3_CONFIG_BUCKET = process.env.S3_CONFIG_BUCKET!;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE!
const queueUrl = process.env.WS_SEND_QUEUE
const tenantId = '986922ea-0eb2-4ca4-ab88-904021866c3b';

const port_map = [
    {name: 'wan', interface: 'ether1'},
    {name: 'fwan', interface: 'sfp-sfpplus2'},
    {name: 'core', interface: 'sfp-sfpplus1'},
    {name: 'south', interface: 'vlan101'},
    {name: 'north', interface: 'vlan102'},
    {name: 'nbn', interface: 'ether1'},
    {name: 'lte', interface: 'lte1'},
    {name: 'lo', interface: 'lo'}

]

export const handler = async (event: any): Promise<any> => {
    const redis: Redis = new Redis(parseInt(process.env.REDIS_CLUSTER_PORT!), process.env.REDIS_CLUSTER_HOST!);
    const config = await getConfigFile(redis);
    const glanceString: string | null = await redis.get('glance');

    let glance: Glance = glanceString ? JSON.parse(glanceString) : {assets: []};

    if (config) {
        const configJSON = JSON.parse(config) as any;
        // console.log(configJSON);
        const hostList = getProcessedHosts(configJSON);
        // console.log(hostList);
        try {
            const requests = hostList.map((host: any) =>
                getInterfaceStatus(host.host, [], redis, host.interfaces).catch((error) => ({hostname: host.host, error}))
            );

            // Run all requests concurrently
            const results = await Promise.all(requests);

            // Process the results as needed
            console.log('All requests have completed.');
            glance = {assets: []};
            for (const result of results) {
                if (result?.data) {
                    await updateGlanceAssets(glance, result.hostname, result.data, result.interfaces, redis, result.routeData);
                } else {
                    await updateGlanceAssets(glance, result.hostname, [], result.interfaces, redis, result.routeData);
                    console.error(`Failed to get data for ${result.hostname}: ${result.error}`);
                }
            }

            // Save the updated glance object back to Redis
            // console.log(`Updated to Cache: ${JSON.stringify(glance, null, 2)}`);
            const send: string = JSON.stringify(glance)
            await redis.set('glance', send);

            // glance.assets.sort(sortAssets)

            const hash: string = objectHash(send, {
                algorithm: 'sha1',
                encoding: 'hex',
                respectType: false,
                respectFunctionProperties: false,
                respectFunctionNames: false
            });

            console.log('All requests have completed and glance has been updated.');

            await sendXmlToSQS(hash, tenantId);

            return {
                statusCode: 200,
                body: JSON.stringify(results)
            };
        } catch (error: any) {
            console.error('Error in handler:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({error: error.message})
            };
        }
    }

};

function sortAssets(a: GlanceAsset, b: GlanceAsset): number {
    if (a.status !== b.status)
        return a.status - b.status;
    if (a.name !== b.name)
        return a.name.localeCompare(b.name);
    return a.hostname.localeCompare(b.hostname);
}

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
    return {config, success: true};
};

function getProcessedHosts(data: any): any[] {
    data = JSON.parse(data);
    const defaultInterfaces = data.interfaces;
    return data.hosts.map((host: any) => {
        if (!host.interfaces) {
            host.interfaces = defaultInterfaces;
        }
        return host;
    });
}

const getInterfaceStatus = async (hostname: string, credentials: Credential[], redis: Redis, interfaces: any[]): Promise<any> => {
    const apiUrl = `https://${hostname}.nms.blacksaltit.com.au/rest`;

    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        const error = "Custom CA certificate not provided";
        console.error(error);
        return {hostname, error, interfaces};
    }
    const caCert = Buffer.from(caCertBase64, 'base64');

    try {
        const newCredential = await getCredentials(redis, hostname);
        if (!newCredential) {
            const error = "No valid credentials found " + hostname;
            console.error(error);
            return {hostname, error, interfaces};
        }

        const {config, success} = await loginWithCredentials(apiUrl, newCredential, caCert);
        if (!success) {
            const error = "Login failed with new credentials " + hostname;
            console.error(error);
            return {hostname, error, interfaces};
        }
        // After successful login, fetch the interface status

        try {
            // console.log('getting data');
            const response = await axios.get(`${apiUrl}/interface`, config);
            // console.log(hostname);
            // console.log(JSON.stringify(response.data, null, 1));

            // console.log(`Response from ${apiUrl}/interface:`, response.data);

            let routeData = [];
            if (hostname.endsWith('mlt6')) {
                try {
                    const routeResponse = await axios.get(`${apiUrl}/ip/route`, config);
                    routeData = routeResponse.data;
                    console.log('here');
                    console.log(hostname);
                    console.log(JSON.stringify(routeData, null, 1));
                } catch (err: any) {
                    console.error(`Failed to get route data for ${hostname}: ${err.message}`);
                }
            }

            return {hostname, data: response.data, interfaces, routeData};

        } catch (err: any) {
            return {hostname, error: 'Could not connect to router.', interfaces};
        }

    } catch (error: any) {
        console.error(`Error fetching interface status for ${hostname}:`, error.message);
        return {hostname, error: error.message, interfaces};
    }
};

async function getConfigFile(redis: Redis): Promise<any> {
    const monitor: string | null = await (redis.get(`monitor.json`));
    // console.log(monitor);
    if (monitor)
        return JSON.stringify(monitor);

    const fromS3 = await readFileFromS3(S3_CONFIG_BUCKET, 'monitor/monitor.json');

    await redis.set('monitor.json', fromS3);

    return fromS3;
}

async function readFileFromS3(bucketName: string, key: string): Promise<string> {
    try {
        const command: GetObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const response: GetObjectCommandOutput = await s3Client.send(command);
        if (response.Body) {
            const streamToString = (stream: Readable) =>
                new Promise<string>((resolve, reject) => {
                    const chunks: Uint8Array[] = [];
                    stream.on("data", (chunk) => chunks.push(chunk));
                    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
                    stream.on("error", reject);
                });

            return await streamToString(response.Body as Readable);
        } else {
            throw new Error("Empty response body");
        }
    } catch (error) {
        console.error("Error reading file from S3:", error);
        throw error;
    }
}

export async function getCredentials(redis: Redis, hostname: string): Promise<Credential | null> {
    const credKey = `api_cred_${hostname}`;
    const siteKey = `api_site_${hostname}`;

    // Step 1: Check if credentials are in Redis
    const cachedCredentials = await redis.get(credKey);
    const cachedSite = await redis.get(siteKey);

    // console.log(`Cached: ${hostname} ${cachedCredentials}`);

    if (cachedCredentials && cachedSite) {
        // console.log(`Credentials found in Redis for ${hostname}`);
        return JSON.parse(cachedCredentials) as Credential;
    }

    const scanParams: ScanCommandInput = {
        TableName: DYNAMODB_TABLE,
        FilterExpression: '#name = :hostname',
        ExpressionAttributeValues: {
            ':hostname': hostname
        },
        ExpressionAttributeNames: {'#name': 'name'}
    };

    const result = await ddbClient.send(new ScanCommand(scanParams));

    if (!result.Items || result.Items.length === 0) {
        console.error(`No asset found with hostname: ${hostname}`);
        return null;
    }

    // Assuming the hostname is unique and should return one item

    const asset = result.Items[0].data as Asset;

    // Step 3: Find the credentials with username = 'api'
    const apiCredential = asset.routerDetails?.credentials.find((cred: Credential) => cred.username === 'api');

    const params: GetCommandInput = {
        TableName: DYNAMODB_TABLE,
        Key: {
            pk: `TENANT#${result.Items[0].tenantId}`,
            sk: result.Items[0].pk
        }
    };

    try {
        const data: GetCommandOutput = await ddbClient.send(new GetCommand(params));
        if (data.Item) {
            // Item was found, process it as needed
            await redis.set(siteKey, data.Item.name);
        } else {
            // Item not found
            console.log('Item not found');
            return null;
        }
    } catch (error: any) {
        console.error('Error getting item:', error);
        throw new Error(`Could not retrieve item: ${error.message}`);
    }

    // console.log(apiCredential);

    if (!apiCredential) {
        console.error(`No 'api' credentials found for asset with hostname: ${hostname}`);
        return null;
    }

    // Step 4: Store the credentials in Redis
    await redis.set(credKey, JSON.stringify(apiCredential));

    // console.log(`Credentials stored in Redis for ${hostname}`);

    return apiCredential;
}

const updateGlanceAssets = async (glance: Glance, hostname: string, data: any[], interfaces: any[], redis: Redis, routeData: any[]) => {
    const siteKey = `api_site_${hostname}`;
    // console.log('Updating glance for hostname:', hostname);
    // console.log('Data received:', data);
    // console.log('Interfaces configuration:', interfaces);

    // Find or create the GlanceAsset for the given hostname
    let asset = glance.assets.find((asset) => asset.hostname === hostname);

    // Array to hold the running statuses of the matched interfaces
    const runningStatuses: boolean[] = [];

    const updatedInterfaces: (GlanceInterfaces)[] = interfaces.map((intf: any) => {
        // console.log(intf.port);
        const int_name = port_map.find(e => e.name === intf.name);
        // if(int_name){
        //     console.log(int_name.interface);
        // }
        const matchingData = data.find(d => d['name'] === int_name?.interface); //d['.id'] === `*${intf.port}`);
        let isRunning = matchingData ? matchingData.running === 'true' : false;

        console.log(int_name?.interface);
        if (hostname.endsWith('mlt6') && isRunning) {
            const hasDefaultRoute = routeData.some(
                route => {
                    return route['dst-address'] === '0.0.0.0/0' &&
                        route['immediate-gw'].endsWith(int_name?.interface)

                }
            );

            console.log(hasDefaultRoute);

            isRunning = isRunning && hasDefaultRoute;
        }

        if (int_name?.interface !== 'lo')
            runningStatuses.push(isRunning);
        return {
            name: intf.name,
            running: isRunning
        };
    }).filter(intf => intf.name !== 'lo');

    console.log(JSON.stringify(updatedInterfaces, null, 1));

    // Determine the status based on runningStatuses
    let status: number;
    if (runningStatuses.every(status => status)) {
        status = 2; // All interfaces are running
    } else if (runningStatuses.every(status => !status)) {
        status = 0; // All interfaces are not running
    } else {
        status = 1; // Some interfaces are running, some are not
    }

    console.log(`${hostname} - ${status}`)

    if (asset) {
        // Update existing asset's status and interfaces
        const name = await redis.get(siteKey)
        // console.log(`name 1: ${name}`)
        asset.name = name ? name : 'Unknown';
        asset.status = status;
        asset.interfaces = updatedInterfaces;
    } else {
        // Add new asset with status and interfaces
        const name = await redis.get(siteKey)
        // console.log(`name 2: ${name}`)
        const newAsset: GlanceAsset = {
            name: name ? name : 'Unknown', // Or any other naming convention
            hostname,
            status,
            interfaces: updatedInterfaces
        };
        glance.assets.push(newAsset);
    }
    // console.log(JSON.stringify(glance, null, 2));
};

const sendXmlToSQS = async (hash: string, tenantId: string): Promise<void> => {
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({hash: hash}),
        MessageGroupId: tenantId,
        MessageDeduplicationId: uuid()
    };

    try {
        const sqsClient: SQSClient = new SQSClient({region: process.env.AWS_REGION});
        const data = await sqsClient.send(new SendMessageCommand(params));
        console.log('Message sent to SQS:', data.MessageId);
    } catch (err) {
        console.error('Error sending message to SQS:', err);
    }
};



