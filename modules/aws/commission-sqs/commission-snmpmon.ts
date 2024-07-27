import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {DeleteMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {SQSHandler} from 'aws-lambda';
import snmp from 'net-snmp';

const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({region: process.env.AWS_REGION});
const S3_CONFIG_BUCKET: string = process.env.S3_CONFIG_BUCKET!;

export const handler: SQSHandler = async (event) => {
    for (const record of event.Records) {
        const message = record.body;
        const body = (JSON.parse(message));
        const {fqdn, hostname} = body;
        const receiptHandle = record.receiptHandle;


        console.log('Received message:', message);

        // Retrieve the file from S3 and update it if necessary
        const s3Params = {
            Bucket: S3_CONFIG_BUCKET,
            Key: 'monitor/monitor.json',
        };

        const getObjectCommand = new GetObjectCommand(s3Params);
        const s3Response = await s3Client.send(getObjectCommand);

        const s3Data = await s3Response.Body?.transformToString('utf-8');
        let monitorConfig = JSON.parse(s3Data || '{}');

        const existingHostIndex = monitorConfig.hosts.findIndex((host: any) => host.host === hostname);
        if (existingHostIndex !== -1) {
            monitorConfig.hosts.splice(existingHostIndex, 1); // Remove existing host entry
        }

        const interfaces = await getSnmpInterfaces(fqdn);
        console.log(interfaces);
        monitorConfig.hosts.push({
            host: hostname,
            interfaces: [
                { name: 'lo', port: interfaces["lo"] || 1},
                { name: 'nbn', port: interfaces["ether1"] || 1},
                { name: 'lte', port: interfaces["lte1"] || 1},
            ],
        });

        const putObjectCommand = new PutObjectCommand({
            Bucket: S3_CONFIG_BUCKET,
            Key: 'monitor/monitor.json',
            Body: JSON.stringify(monitorConfig),
            ContentType: 'application/json',
        });

        await s3Client.send(putObjectCommand);

        // Delete the message from the queue
        const deleteParams = {
            QueueUrl: process.env.QUEUE_URL!,
            ReceiptHandle: receiptHandle,
        };

        try {
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
            console.log('Message deleted successfully');
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
};

const getSnmpInterfaces = async (hostname: string): Promise<{ [key: string]: string }> => {
    const session = snmp.createSession(hostname, "bsitaskenosnmp-ro");
    const oid = "1.3.6.1.2.1.2.2.1.2"; // ifDescr OID
    return new Promise((resolve, reject) => {
        const interfaces: { [key: string]: string } = {};

        session.subtree(oid, (varbinds : any) => {
            varbinds.forEach((varbind: any) => {
                if (snmp.isVarbindError(varbind)) {
                    console.error(snmp.varbindError(varbind));
                } else {
                    interfaces[varbind.value.toString()] = varbind.oid.split('.').pop();
                }
            });
        }, (error: any) => {
            session.close();
            if (error) {
                reject(error);
            } else {
                resolve(interfaces);
            }
        });
    });
};
