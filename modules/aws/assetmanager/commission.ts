import {DynamoDBClient, GetItemCommand} from '@aws-sdk/client-dynamodb';
import {ChangeResourceRecordSetsCommand, ChangeResourceRecordSetsCommandInput, ListResourceRecordSetsCommand, Route53Client} from '@aws-sdk/client-route-53';
import {SendMessageCommand, SendMessageCommandInput, SQSClient} from '@aws-sdk/client-sqs';
import {APIGatewayProxyResult} from 'aws-lambda';

const dynamoDbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const route53Client = new Route53Client({});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const COMMISSION_LIBRE_SQS: string = process.env.COMMISSION_LIBRE_SQS!;
const COMMISSION_SNMPMON_SQS: string = process.env.COMMISSION_SNMPMON_SQS!;
const COMMISSION_CRED_SQS: string = process.env.COMMISSION_CRED_SQS!;
const sqsClient: SQSClient = new SQSClient({region: process.env.AWS_REGION});

export const commissionAsset = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: { S: `SITE#${siteId}` },
            sk: { S: `ASSET#${assetId}` },
        },
    };

    const getItemCommand = new GetItemCommand(getItemParams);
    const asset = await dynamoDbClient.send(getItemCommand);
    const hostname = asset.Item?.data?.M?.hostname?.S;
    const ip = asset.Item?.data?.M?.loopbacks?.L?.[0]?.S ?? '0.0.0.0';


    if (!hostname) {
        throw new Error('Hostname not found in asset data');
    }

    // Add hostname to Route 53 zone if it doesn't already exist
    const zoneId = 'Z07424691KDSATL0NNNLN';
    const fqdn = `${hostname}.nms.blacksaltit.com.au`;

    const listRecordsParams = {
        HostedZoneId: zoneId,
    };

    const listRecordsCommand = new ListResourceRecordSetsCommand(listRecordsParams);
    const listRecordsResponse = await route53Client.send(listRecordsCommand);

    const recordExists = listRecordsResponse.ResourceRecordSets?.some(record => record.Name === `${fqdn}.`);

    if (!recordExists) {
        const changeRecordParams: ChangeResourceRecordSetsCommandInput = {
            HostedZoneId: zoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: 'CREATE',
                        ResourceRecordSet: {
                            Name: fqdn,
                            Type: 'A',
                            TTL: 300,
                            ResourceRecords: [{ Value: ip }],
                        },
                    },
                ],
            },
        };
        const changeRecordCommand = new ChangeResourceRecordSetsCommand(changeRecordParams);
        await route53Client.send(changeRecordCommand);
    }

    //Send to SQS Queue and continue commissioning after DNS records have been updated (allow 60 seconds).
    const messageBody = JSON.stringify({ hostname, fqdn, siteId, assetId });

    const sqsParamsLibre: SendMessageCommandInput = {
        QueueUrl: COMMISSION_LIBRE_SQS,
        MessageBody: messageBody,
        MessageGroupId: fqdn,
        MessageDeduplicationId: `${fqdn}-${Date.now()}`
    };
    const sqsParamsCred: SendMessageCommandInput = {
        QueueUrl: COMMISSION_CRED_SQS,
        MessageBody: messageBody,
        MessageGroupId: fqdn,
        MessageDeduplicationId: `${fqdn}-${Date.now()}`
    };

    const sqsParamsSNMPMon: SendMessageCommandInput = {
        QueueUrl: COMMISSION_SNMPMON_SQS,
        MessageBody: messageBody,
        MessageGroupId: fqdn,
        MessageDeduplicationId: `${fqdn}-${Date.now()}`
    };

    await sqsClient.send(new SendMessageCommand(sqsParamsLibre));
    await sqsClient.send(new SendMessageCommand(sqsParamsSNMPMon));
    await sqsClient.send(new SendMessageCommand(sqsParamsCred));

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Operation completed successfully' }),
    };
};


