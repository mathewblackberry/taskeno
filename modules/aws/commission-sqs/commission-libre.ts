import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DeleteMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';
import {SQSHandler} from 'aws-lambda';
import axios from 'axios';
import https from 'https';

const sqsClient = new SQSClient({region: process.env.AWS_REGION});
const LIBRE_API_TOKEN: string = process.env.LIBRE_API_TOKEN!;
const CA_BASE64_CERT: string = process.env.CA_BASE64_CERT!;
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const dynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const message = record.body;
        const body = (JSON.parse(message));
        const {fqdn, siteId, assetId} = body;
        const receiptHandle = record.receiptHandle;

        console.log('Received message:', message);
        const librenmsApiUrl = 'https://taskeno.nms.blacksaltit.com.au/api/v0/devices';
        const librenmsApiToken = LIBRE_API_TOKEN;
        const customCa = Buffer.from(CA_BASE64_CERT, 'base64');
        const httpsAgent = new https.Agent({ca: customCa});
        const axiosInstance = axios.create({httpsAgent});

        const librenmsResponse = await axiosInstance.get(librenmsApiUrl, {
            headers: {
                'X-Auth-Token': librenmsApiToken
            }
        });

        const librenmsDeviceExists = librenmsResponse.data.devices.some((device: any) => device.hostname === fqdn);
        if (!librenmsDeviceExists) {
            await axiosInstance.post(
                librenmsApiUrl,
                {
                    hostname: fqdn,
                    version: 'v2c',
                    community: 'bsitaskenosnmp-ro'
                },
                {
                    headers: {
                        'X-Auth-Token': librenmsApiToken,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }



        const deleteParams = {
            QueueUrl: process.env.QUEUE_URL!,
            ReceiptHandle: receiptHandle
        };

        try {
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
            console.log('Message deleted successfully');
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
};

