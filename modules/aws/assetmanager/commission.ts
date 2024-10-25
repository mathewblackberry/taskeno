import {DynamoDBClient, GetItemCommand} from '@aws-sdk/client-dynamodb';
import {ChangeResourceRecordSetsCommand, ChangeResourceRecordSetsCommandInput, ListResourceRecordSetsCommand, ListResourceRecordSetsCommandInput, Route53Client} from '@aws-sdk/client-route-53';
import {SendMessageCommand, SendMessageCommandInput, SQSClient} from '@aws-sdk/client-sqs';
import {DynamoDBDocumentClient, GetCommand} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';
import {SESClient, SendEmailCommand} from '@aws-sdk/client-ses';
import https from 'https';
import axios from "axios";
import {Asset, Credential, Site} from './model';

const dynamoDbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const route53Client = new Route53Client({});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const COMMISSION_LIBRE_SQS: string = process.env.COMMISSION_LIBRE_SQS!;
const COMMISSION_SNMPMON_SQS: string = process.env.COMMISSION_SNMPMON_SQS!;
const COMMISSION_CRED_SQS: string = process.env.COMMISSION_CRED_SQS!;
const sqsClient: SQSClient = new SQSClient({region: process.env.AWS_REGION});
const sesClient = new SESClient({region: process.env.AWS_REGION});

export const commissionAsset = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        }
    };

    const getItemCommand = new GetCommand(getItemParams);
    const asset = await ddbDocClient.send(getItemCommand);
    const hostname = asset.Item?.data?.hostname;
    const ip = asset.Item?.data?.loopbacks[0] ?? '0.0.0.0';

    if (!hostname) {
        throw new Error('Hostname not found in asset data');
    }

    // Add hostname to Route 53 zone if it doesn't already exist
    const zoneId = 'Z07424691KDSATL0NNNLN';
    const fqdn = `${hostname}.nms.blacksaltit.com.au`;

    const listRecordsParams: ListResourceRecordSetsCommandInput = {
        HostedZoneId: zoneId,
        StartRecordName: fqdn,
        MaxItems: 10
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
                            ResourceRecords: [{Value: ip}]
                        }
                    }
                ]
            }
        };
        const changeRecordCommand = new ChangeResourceRecordSetsCommand(changeRecordParams);
        await route53Client.send(changeRecordCommand);
    }

    //Send to SQS Queue and continue commissioning after DNS records have been updated (allow 60 seconds).
    const messageBody = JSON.stringify({hostname, fqdn, siteId, assetId});

    const sqsParamsLibre: SendMessageCommandInput = {
        QueueUrl: COMMISSION_LIBRE_SQS,
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

    const getSiteParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `SITE#${siteId}`
        }
    };

    const getSiteCommand = new GetCommand(getSiteParams);

    const ddb_site = await ddbDocClient.send(getSiteCommand);

    const site = ddb_site.Item?.data;

    if (site) {
        const params = {
            Destination: {
                ToAddresses: ['accounts@blacksaltit.com.au']
            },
            Message: {
                Body: {
                    Html: {
                        Data: `
<html lang="en">
<body>
      <p style="font-family: 'Courier New', Courier, monospace;"><span style="font-weight: bold">Site: &nbsp;&nbsp;&nbsp;</span><span>${site.name}</span></p>                 
      <p style="font-family: 'Courier New', Courier, monospace;"><span style="font-weight: bold">Address: </span><span>${site.address}</span><br>             
      <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${site.city}, ${site.state}, ${site.postcode}</span></p>                 
      <p style="font-family: 'Courier New', Courier, monospace;"><span style="font-weight: bold">FNN: &nbsp;&nbsp;&nbsp;&nbsp;</span><span>${asset.Item?.data.FNN}</span></p>                 
</body>
</html>`
                    },
                    Text: {
                        Data:
                            `Site: ${site.name}
Address: ${site.address}, ${site.city}, ${site.state}, ${site.postcode}
FNN: ${asset.Item?.data.FNN}
                            `

                    }
                },
                Subject: {
                    Data: `Keno Site Transitioned - [${site.name}]`
                }
            },
            Source: 'support@blacksaltit.com.au'
        };
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);

    }

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Operation completed successfully'})
    };
};

export const commissionAssetCred = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];
    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: {S: `SITE#${siteId}`},
            sk: {S: `ASSET#${assetId}`}
        }
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

    const listRecordsParams: ListResourceRecordSetsCommandInput = {
        HostedZoneId: zoneId,
        StartRecordName: fqdn,
        MaxItems: 10
    };

    const listRecordsCommand: ListResourceRecordSetsCommand = new ListResourceRecordSetsCommand(listRecordsParams);
    const listRecordsResponse = await route53Client.send(listRecordsCommand);

    const recordExists = listRecordsResponse.ResourceRecordSets?.some(record => record.Name === `${fqdn}.`);
    console.log(`DNS: ${JSON.stringify(listRecordsResponse.ResourceRecordSets)}`);

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
                            ResourceRecords: [{Value: ip}]
                        }
                    }
                ]
            }
        };
        const changeRecordCommand = new ChangeResourceRecordSetsCommand(changeRecordParams);
        await route53Client.send(changeRecordCommand);
    }

    //Send to SQS Queue and continue commissioning after DNS records have been updated (allow 60 seconds).
    const messageBody = JSON.stringify({hostname, fqdn, siteId, assetId});

    const sqsParamsCred: SendMessageCommandInput = {
        QueueUrl: COMMISSION_CRED_SQS,
        MessageBody: messageBody,
        MessageGroupId: fqdn,
        MessageDeduplicationId: `${fqdn}-${Date.now()}`
    };

    await sqsClient.send(new SendMessageCommand(sqsParamsCred));

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Operation completed successfully'})
    };
};

export const updateSNMP = async (pathParameters: string[]): Promise<APIGatewayProxyResult>=> {
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        }
    };

    const getItemCommand = new GetCommand(getItemParams);
    const assetdb = await ddbDocClient.send(getItemCommand);
    const hostname = assetdb.Item?.data?.hostname;
    const loopback = assetdb.Item?.data?.loopbacks[0] ?? '0.0.0.0';
    const asset: Asset = assetdb.Item?.data;

    const apiUrl = `https://${hostname}.nms.blacksaltit.com.au/rest`;

    const getSiteParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `SITE#${siteId}`
        }
    };

    const getSiteCommand = new GetCommand(getSiteParams);
    const ddb_site = await ddbDocClient.send(getSiteCommand);
    const site: Site = ddb_site.Item?.data;



    const caCertBase64 = process.env.CA_BASE64_CERT;
    if (!caCertBase64) {
        console.error("Custom CA certificate not provided");
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'Could not securely connect to router'})
        };
    }
    const caCert = Buffer.from(caCertBase64, 'base64');
    const newCredential = asset.routerDetails!.credentials.find(c => c.username === 'api');

    const success = await updateRouterSNMP(apiUrl, site, asset, newCredential!, caCert);

    if(success)
    return {
        statusCode: 200,
        body: JSON.stringify({message: 'SNMP completed successfully'})
    };

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'SNMP could not be updated'})
    };

};

const updateRouterSNMP = async (apiUrl: string, site: Site, asset: Asset, credentials: Credential, caCert: Buffer): Promise<boolean> => {
    const httpsAgent = new https.Agent({
        ca: caCert,
        keepAlive: true,
        keepAliveMsecs: 1000
    });

    const data = {
        enabled: "true",
        contact: "support@blacksaltit.com.au",
        location: `${site.address}, ${site.city} ${site.state} ${site.postcode} [${site.latitude}, ${site.longitude}]`,
        'src-address': asset.loopbacks[0],
        'trap-community': 'bsitaskenosnmp-ro',
        'trap-generators':'interfaces',
        'trap-interfaces': 'all',
        'trap-target': '172.27.251.10'
    }

    const ipsettings ={
        'arp-timeout': '60m'
    }

    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        },
        httpsAgent,
        timeout: 5000
    };

    try {
        const response = await axios.post(`${apiUrl}/snmp/set`, data, config);
        console.log(response);
        const r2 = await axios.post(`${apiUrl}/ip/settings/set`, ipsettings, config);
        console.log(r2);
        console.log('SNMP settings updated successfully');
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};
