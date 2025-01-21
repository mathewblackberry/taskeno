import {
    DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
    ChangeResourceRecordSetsCommand,
    ChangeResourceRecordSetsCommandInput,
    ListResourceRecordSetsCommand,
    ListResourceRecordSetsCommandInput,
    Route53Client
} from '@aws-sdk/client-route-53';
import {
    SendMessageCommand,
    SendMessageCommandInput,
    SQSClient
} from '@aws-sdk/client-sqs';
import {
    DynamoDBDocumentClient,
    GetCommand, PutCommand, PutCommandInput, ScanCommand, UpdateCommand, UpdateCommandInput
} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';
import {
    SESClient,
    SendEmailCommand,
    SendEmailCommandInput
} from '@aws-sdk/client-ses';
import https from 'https';
import axios, {AxiosRequestConfig} from "axios";
import {IPv4, IPv4CidrRange, Octet} from 'ip-num';
import {Asset, Credential, Site} from './model';

interface InitResult {
    statusCode?: number;
    body?: string;
    config?: AxiosRequestConfig;
    apiUrl?: string;
    asset?: Asset;
}

const dynamoDbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const route53Client = new Route53Client({});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const COMMISSION_LIBRE_SQS: string = process.env.COMMISSION_LIBRE_SQS!;
const COMMISSION_SNMPMON_SQS: string = process.env.COMMISSION_SNMPMON_SQS!;
const COMMISSION_CRED_SQS: string = process.env.COMMISSION_CRED_SQS!;
const sqsClient: SQSClient = new SQSClient({region: process.env.AWS_REGION});
const sesClient = new SESClient({region: process.env.AWS_REGION});
const ZONE_ID = 'Z07424691KDSATL0NNNLN';
const DOMAIN = 'nms.blacksaltit.com.au';
const CA_CERT_BASE64 = process.env.CA_BASE64_CERT;

//--------------------------------------
// Helper functions
//--------------------------------------

async function getAssetFromDynamo(siteId: string, assetId: string): Promise<Asset | undefined> {
    const getItemParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `SITE#${siteId}`,
            sk: `ASSET#${assetId}`
        }
    };
    const assetResponse = await ddbDocClient.send(new GetCommand(getItemParams));
    const asset = assetResponse.Item?.data as Asset;

    if (asset && asset.loopbacks) {
        asset.loopbacks = asset.loopbacks.map((item) => {
            if (typeof item === 'string') {
                return IPv4CidrRange.fromCidr(`${item}/32`);
            }
            throw new Error(`Unexpected loopback type: ${item}`);
        });
    }

    return asset;

}

async function getAssetByHostname(hostname: string): Promise<Asset | undefined> {
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: '#name = :hname',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':hname': hostname
        }
    };

    const response = await ddbDocClient.send(new ScanCommand(params));
    if (response.Items && response.Items.length > 0) {
        return response.Items[0].data as Asset;
    }

    return undefined;
}

async function getSiteFromDynamo(tenantId: string, siteId: string): Promise<Site | undefined> {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `SITE#${siteId}`
        }
    };
    const siteResponse = await ddbDocClient.send(new GetCommand(params));
    return siteResponse.Item?.data as Site;
}

async function ensureRoute53Record(hostname: string, ip: string): Promise<void> {
    const fqdn = `${hostname}.${DOMAIN}`;
    const listParams: ListResourceRecordSetsCommandInput = {
        HostedZoneId: ZONE_ID,
        StartRecordName: fqdn,
        MaxItems: 10
    };

    const listRecordsResponse = await route53Client.send(new ListResourceRecordSetsCommand(listParams));
    const recordExists = listRecordsResponse.ResourceRecordSets?.some(record => record.Name === `${fqdn}.`);

    if (!recordExists) {
        const changeParams: ChangeResourceRecordSetsCommandInput = {
            HostedZoneId: ZONE_ID,
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
        await route53Client.send(new ChangeResourceRecordSetsCommand(changeParams));
    }
}

async function sendSQSMessage(queueUrl: string, hostname: string, fqdn: string, siteId: string, assetId: string): Promise<void> {
    const messageBody = JSON.stringify({hostname, fqdn, siteId, assetId});
    const sqsParams: SendMessageCommandInput = {
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        MessageGroupId: fqdn,
        MessageDeduplicationId: `${fqdn}-${Date.now()}`
    };
    await sqsClient.send(new SendMessageCommand(sqsParams));
}

async function sendCommissioningEmail(site: Site, fnn?: string): Promise<void> {
    const params: SendEmailCommandInput = {
        Destination: {
            ToAddresses: ['accounts@blacksaltit.com.au', 'help@taskeno.com.au'],
            CcAddresses: ['jkoay@federalit.net']
        },
        Message: {
            Body: {
                Html: {
                    Data: `
<html lang="en">
<body>
  <p style="font-family: 'Courier New', Courier, monospace;">
    <span style="font-weight: bold">Site: &nbsp;&nbsp;&nbsp;</span><span>${site.name}</span>
  </p>                 
  <p style="font-family: 'Courier New', Courier, monospace;">
    <span style="font-weight: bold">Address: </span><span>${site.address}</span><br>             
    <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${site.city}, ${site.state}, ${site.postcode}</span>
  </p>                 
  <p style="font-family: 'Courier New', Courier, monospace;">
    <span style="font-weight: bold">FNN: &nbsp;&nbsp;&nbsp;&nbsp;</span><span>${fnn ?? ''}</span>
  </p>                 
</body>
</html>`
                },
                Text: {
                    Data: `Site: ${site.name}
Address: ${site.address}, ${site.city}, ${site.state}, ${site.postcode}
FNN: ${fnn ?? ''}`
                }
            },
            Subject: {
                Data: `Keno Site Transitioned - [${site.name}]`
            }
        },
        Source: 'support@blacksaltit.com.au'
    };
    await sesClient.send(new SendEmailCommand(params));
}

function createHttpsAgent(caCertBase64?: string): https.Agent | undefined {
    if (!caCertBase64) return undefined;
    const caCert = Buffer.from(caCertBase64, 'base64');
    return new https.Agent({
        ca: caCert,
        keepAlive: true,
        keepAliveMsecs: 1000
    });
}

export async function initializeApiAccess(pathParameters: string[]): Promise<InitResult> {
    const p1 = pathParameters[1];
    const p2 = pathParameters[2];
    const assetId = pathParameters[4];

    let asset = undefined;

    if (p1 === 'resetusb')
        asset = await getAssetByHostname(p2);
    else
        asset = await getAssetFromDynamo(p2, assetId);

    if (!asset || !asset.hostname || !CA_CERT_BASE64) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'Missing asset, hostname or CA cert'})
        };
    }

    const credentials: Credential | undefined = asset.routerDetails?.credentials.find(c => c.username === 'api');
    if (!credentials) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'API credentials not found'})
        };
    }

    const apiUrl = `https://${asset.hostname}.${DOMAIN}/rest`;
    const httpsAgent = createHttpsAgent(CA_CERT_BASE64);

    const config: AxiosRequestConfig = {
        headers: {Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`},
        httpsAgent,
        timeout: 5000
    };

    return {config, apiUrl, asset};
}

//--------------------------------------
// Lambda Handlers
//--------------------------------------

export const commissionAsset = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    const asset = await getAssetFromDynamo(siteId, assetId);
    if (!asset) {
        throw new Error('Asset not found');
    }

    const hostname = asset.hostname;
    const ip: IPv4CidrRange = asset.loopbacks?.[0] ?? '0.0.0.0';
    if (!hostname) {
        throw new Error('Hostname not found in asset data');
    }

    await ensureRoute53Record(hostname, ip.getFirst().toString());

    // Send to SQS Queues
    const fqdn = `${hostname}.${DOMAIN}`;
    await sendSQSMessage(COMMISSION_LIBRE_SQS, hostname, fqdn, siteId, assetId);
    await sendSQSMessage(COMMISSION_SNMPMON_SQS, hostname, fqdn, siteId, assetId);

    const site = await getSiteFromDynamo(tenantId, siteId);
    if (site) {
        await sendCommissioningEmail(site, asset.FNN);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Operation completed successfully'})
    };
};

export const commissionAssetCred = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    // Here we could also switch to `ddbDocClient` for consistency
    const asset = await getAssetFromDynamo(siteId, assetId);
    if (!asset) {
        throw new Error('Asset not found');
    }

    const hostname = asset.hostname;
    const ip: IPv4CidrRange = asset.loopbacks?.[0] ?? '0.0.0.0';

    if (!hostname) {
        throw new Error('Hostname not found in asset data');
    }

    await ensureRoute53Record(hostname, ip.getFirst().toString());

    const fqdn = `${hostname}.${DOMAIN}`;
    await sendSQSMessage(COMMISSION_CRED_SQS, hostname, fqdn, siteId, assetId);

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Operation completed successfully'})
    };
};

export const updateSNMP = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const assetId = pathParameters[4];

    const asset = await getAssetFromDynamo(siteId, assetId);
    if (!asset) {
        return {
            statusCode: 404,
            body: JSON.stringify({message: 'Asset not found'})
        };
    }

    const hostname = asset.hostname;
    if (!hostname || !CA_CERT_BASE64) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'Missing hostname or CA cert'})
        };
    }

    const site = await getSiteFromDynamo(tenantId, siteId);
    if (!site) {
        return {
            statusCode: 404,
            body: JSON.stringify({message: 'Site not found'})
        };
    }

    const httpsAgent = createHttpsAgent(CA_CERT_BASE64);
    const credentials = asset.routerDetails?.credentials.find(c => c.username === 'api');
    if (!credentials) {
        return {
            statusCode: 400,
            body: JSON.stringify({message: 'API credentials not found'})
        };
    }

    const apiUrl = `https://${hostname}.${DOMAIN}/rest`;
console.log('1');
    const success = await updateRouterSNMP(apiUrl, site, asset, credentials, httpsAgent!);
console.log('2');
    if (success) {
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'SNMP completed successfully'})
        };
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'SNMP could not be updated'})
    };
};

async function updateRouterSNMP(apiUrl: string, site: Site, asset: Asset, credentials: Credential, httpsAgent: https.Agent): Promise<boolean> {
    const data = {
        enabled: "true",
        contact: "support@blacksaltit.com.au",
        location: `${site.address}, ${site.city} ${site.state} ${site.postcode} [${site.latitude}, ${site.longitude}]`,
        'src-address': asset.loopbacks[0].getFirst().toString(),
        'trap-community': 'bsitaskenosnmp-ro',
        'trap-generators': 'interfaces',
        'trap-interfaces': 'all',
        'trap-target': '172.27.251.10'
    };

    const ipsettings = {
        'arp-timeout': '60m'
    };

    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`
        },
        httpsAgent,
        timeout: 5000
    };

    try {
        await axios.post(`${apiUrl}/snmp/set`, data, config);
        await axios.post(`${apiUrl}/ip/settings/set`, ipsettings, config);
        console.log('SNMP settings updated successfully');
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

export const updateTZ = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const initResult = await initializeApiAccess(pathParameters);
    if (initResult.statusCode && initResult.body)
        return {statusCode: initResult.statusCode, body: initResult.body};

    const {config, apiUrl} = initResult;

    const data = {
        'time-zone-autodetect': false,
        'time-zone-name': 'Australia/Hobart'
    };

    try {
        await axios.post(`${apiUrl}/system/clock/set`, data, config);
        console.log('Timezone updated successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Timezone updated successfully'})
        };
    } catch (err) {
        console.log(err);
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'Timezone was not updated'})
    };
};

export const resetUSB = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const initResult = await initializeApiAccess(pathParameters);
    if (initResult.statusCode && initResult.body)
        return {statusCode: initResult.statusCode, body: initResult.body};

    const {config, apiUrl} = initResult;
    const data = {
        'bus': '2',
        'duration': '45s'
    };
    try {
        await axios.post(`${apiUrl}/system/routerboard/usb/power-reset`, data, config);
        console.log('USB Reset submitted successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'USB Reset submitted'})
        };
    } catch (err) {
        console.log(err);
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'USB Reset unsuccessful'})
    };
};

export const addWiFiMaster = async (pathParameters: string[], body: { subnet: string, vlan: number }): Promise<APIGatewayProxyResult> => {
    const initResult = await initializeApiAccess(pathParameters);
    if (initResult.statusCode && initResult.body)
        return {statusCode: initResult.statusCode, body: initResult.body};

    const {config, apiUrl, asset} = initResult;
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const site: Site | undefined = await getSiteFromDynamo(tenantId, siteId);

    if (site && site.wifiuplinkPSK) {

    } else if (site) {
        const psk = generatePassword(24);
        site.wifiuplinkPSK = psk;
        updateSite(site, tenantId, siteId);
    } else {
        return {statusCode: 400, body: JSON.stringify({message: 'Could not find site!'})}
    }

    try {
        const bridges = await axios.get(`${apiUrl}/interface/bridge`, config);
        const bridgeNames = new Set(bridges.data.map((item: any) => item.name));
        const wifiUplinkBridgeExists = bridgeNames.has('bridge-wifiuplink');
        const wifiAccessBridgeExists = bridgeNames.has('bridge-wifiaccess');

        if (!wifiUplinkBridgeExists) {
            const data = {'name': 'bridge-wifiuplink'};
            await axios.put(`${apiUrl}/interface/bridge`, data, config);
        }

        if (!wifiAccessBridgeExists) {
            const data = {'name': 'bridge-wifiaccess', 'vlan-filtering': 'yes'};
            await axios.put(`${apiUrl}/interface/bridge`, data, config);
        }

        const bridgeports = await axios.get(`${apiUrl}/interface/bridge/port`, config);
        const wlan2port = bridgeports.data.find((item: any) => item['interface'] === 'wlan2');
        if (wlan2port) { //already exists
            const data = {'bridge': 'bridge-wifiuplink'};
            await axios.patch(`${apiUrl}/interface/bridge/port/${wlan2port['.id']}`, data, config);
        } else {
            const data = {'bridge': 'bridge-wifiuplink', 'interface': 'wlan2'};
            await axios.put(`${apiUrl}/interface/bridge/port`, data, config);
        }

        const bridgevlans = await axios.get(`${apiUrl}/interface/bridge/vlan`, config);
        const accessvlans = bridgevlans.data.find((item: any) => item['bridge'] === 'bridge-wifiaccess' && item['dynamic'] === 'false');
        if (accessvlans) { //already exists
            const data = {'tagged': 'bridge-wifiaccess', 'vlan-ids': `${body.vlan}`};
            await axios.patch(`${apiUrl}/interface/bridge/vlan/${accessvlans['.id']}`, data, config);
        } else {
            const data = {'tagged': 'bridge-wifiaccess', 'vlan-ids': `${body.vlan}`, 'bridge': 'bridge-wifiaccess'};
            await axios.put(`${apiUrl}/interface/bridge/vlan`, data, config);
        }

        const secprofile = await axios.get(`${apiUrl}/interface/wireless/security-profiles`, config);
        const uplinkprofile = secprofile.data.find((item: any) => item['name'] === 'wifiuplink');

        if (uplinkprofile) {
            const data = {'authentication-types': 'wpa2-psk', 'mode': 'dynamic-keys', 'wpa2-pre-shared-key': site.wifiuplinkPSK}
            await axios.patch(`${apiUrl}/interface/wireless/security-profiles/${uplinkprofile['.id']}`, data, config);
        } else {
            const data = {'authentication-types': 'wpa2-psk', 'mode': 'dynamic-keys', 'name': 'wifiuplink', 'wpa2-pre-shared-key': site.wifiuplinkPSK}
            await axios.put(`${apiUrl}/interface/wireless/security-profiles`, data, config);
        }

        const wireless = await axios.get(`${apiUrl}/interface/wireless`, config);
        const wlan2 = wireless.data.find((item: any) => item['default-name'] === 'wlan2');
        if (wlan2) {
            const data = {
                'band': '5ghz-onlyac', 'country': 'australia', 'disabled': 'no', 'hide-ssid': 'yes', 'mode': 'ap-bridge',
                'ssid': 'tkapuplink', 'wds-default-bridge': 'bridge-wifiuplink', 'wds-mode': 'dynamic', 'wps-mode': 'disabled',
                'security-profile': 'wifiuplink'
            }
            await axios.patch(`${apiUrl}/interface/wireless/${wlan2['.id']}`, data, config);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({message: 'WiFi is not enabled on router or incorrect driver.'})
            };
        }

        const vlans = await axios.get(`${apiUrl}/interface/vlan`, config);
        const vlanif = vlans.data.find((item: any) => item['name'] === `vlan${body.vlan}`);

        if (vlanif) { //already exists
            if (vlanif['interface'] !== 'bridge-wifiaccess') return {statusCode: 400, body: JSON.stringify({message: 'Fusion VLAN already exists on incorrect interface!'})};
            if (vlanif['vlan-id'] !== `${body.vlan}`) return {statusCode: 400, body: JSON.stringify({message: `VLAN ${body.vlan} exists and is mis-configured (wrong vlan id)`})};
        } else {
            const data = {'interface': 'bridge-wifiaccess', 'name': `vlan${body.vlan}`, 'vlan-id': `${body.vlan}`}
            await axios.put(`${apiUrl}/interface/vlan`, data, config);
        }

        const cmsec = await axios.get(`${apiUrl}/caps-man/security`, config);
        const fusioncmsec = cmsec.data.find((item: any) => item['name'] === 'fusion');

        if (fusioncmsec) {
            const data = {'authentication-types': 'wpa2-psk', 'name': 'fusion', 'passphrase': 'tkfusion'};
            await axios.patch(`${apiUrl}/caps-man/security/${fusioncmsec['.id']}`, data, config);
        } else {
            const data = {'authentication-types': 'wpa2-psk', 'name': 'fusion', 'passphrase': 'tkfusion'};
            await axios.put(`${apiUrl}/caps-man/security`, data, config);
        }

        const cmconf = await axios.get(`${apiUrl}/caps-man/configuration`, config);
        const fusioncmconf = cmconf.data.find((item: any) => item['name'] === 'fusion');

        if (fusioncmconf) {
            const data = {
                'channel.band': '2ghz-b/g/n', 'country': 'australia', 'datapath.bridge': 'bridge-wifiaccess',
                'datapath.vlan-id': `${body.vlan}`, 'datapath.vlan-mode': 'use-tag', 'mode': 'ap', 'name': 'fusion',
                'security': 'fusion', 'ssid': 'tkfusion'
            }
            await axios.patch(`${apiUrl}/caps-man/configuration/${fusioncmconf['.id']}`, data, config);
        } else {
            const data = {
                'channel.band': '2ghz-b/g/n', 'country': 'australia', 'datapath.bridge': 'bridge-wifiaccess',
                'datapath.vlan-id': `${body.vlan}`, 'datapath.vlan-mode': 'use-tag', 'mode': 'ap', 'name': 'fusion',
                'security': 'fusion', 'ssid': 'tkfusion'
            }
            await axios.put(`${apiUrl}/caps-man/configuration`, data, config);
        }

        const data = {'enabled': 'yes'};
        await axios.post(`${apiUrl}/caps-man/manager/set`, data, config);

        const cmint = await axios.get(`${apiUrl}/caps-man/manager/interface`, config);
        const cmintwifibridge = cmint.data.find((item: any) => item['interface'] === 'bridge-wifiuplink');
        const cmintlo = cmint.data.find((item: any) => item['interface'] === 'lo');

        if (cmintwifibridge) {
            const data = {'disabled': 'no'};
            await axios.patch(`${apiUrl}/caps-man/manager/interface/${cmintwifibridge['.id']}`, data, config);
        } else {
            const data = {'disabled': 'no', 'interface': 'bridge-wifiuplink'};
            await axios.put(`${apiUrl}/caps-man/manager/interface`, data, config);
        }

        if (cmintlo) {
            const data = {'disabled': 'no'};
            await axios.patch(`${apiUrl}/caps-man/manager/interface/${cmintlo['.id']}`, data, config);
        } else {
            const data = {'disabled': 'no', 'interface': 'lo'};
            await axios.put(`${apiUrl}/caps-man/manager/interface`, data, config);
        }

        const provisioning = await axios.get(`${apiUrl}/caps-man/provisioning`, config);
        const provfusion = provisioning.data.find((item: any) => item['master-configuration'] === 'fusion');

        if (provfusion) {
            const data = {'action': 'create-enabled'};
            await axios.patch(`${apiUrl}/caps-man/provisioning/${provfusion['.id']}`, data, config);
        } else {
            const data = {'action': 'create-enabled', 'master-configuration': 'fusion'};
            await axios.put(`${apiUrl}/caps-man/provisioning`, data, config);
        }

        const ips = await axios.get(`${apiUrl}/ip/address`, config);
        const uplinkip = ips.data.find((item: any) => item.interface === 'bridge-wifiuplink');
        const accessip = ips.data.find((item: any) => item.interface === `vlan${body.vlan}`);

        if (!uplinkip) {
            const data = {'address': '192.168.99.1/30', 'interface': 'bridge-wifiuplink', 'network': '192.168.99.0'}
            await axios.put(`${apiUrl}/ip/address`, data, config);
        }
        const {prefix, networkAddress, firstUsableAddress, remainingUsable} = getSubnetInfo(body);
        if (!accessip) {
            const data = {'address': `${firstUsableAddress}/${prefix}`, 'interface': `vlan${body.vlan}`, 'network': `${networkAddress}`}
            await axios.put(`${apiUrl}/ip/address`, data, config);
        }

        const pools = await axios.get(`${apiUrl}/ip/pool`, config);
        const fusionpool = pools.data.find((item: any) => item['name'] === 'fusion');
        if (fusionpool) {
            const data = {'ranges': remainingUsable};
            await axios.patch(`${apiUrl}/ip/pool/${fusionpool['.id']}`, data, config);
        } else {
            const data = {'name': 'fusion', 'ranges': remainingUsable};
            await axios.put(`${apiUrl}/ip/pool`, data, config);
        }

        const dhcpservs = await axios.get(`${apiUrl}/ip/dhcp-server`, config);
        const fusionserv = dhcpservs.data.find((item: any) => item['name'] === 'fusion');
        if (fusionserv) {
            const data = {'interface': `vlan${body.vlan}`, 'address-pool': 'fusion'};
            await axios.patch(`${apiUrl}/ip/dhcp-server/${fusionserv['.id']}`, data, config);
        } else {
            const data = {'name': 'fusion', 'interface': `vlan${body.vlan}`, 'address-pool': 'fusion'};
            await axios.put(`${apiUrl}/ip/dhcp-server`, data, config);
        }

        const dhcpnets = await axios.get(`${apiUrl}/ip/dhcp-server/network`, config);
        const accessnet = dhcpnets.data.find((item: any) => item['address'] === body.subnet);

        if (accessnet) {
            const data = {'dns-server': '8.8.8.8,8.8.4.4', 'gateway': firstUsableAddress.toString(), 'netmask': `${prefix}`}
            await axios.patch(`${apiUrl}/ip/dhcp-server/network/${accessnet['.id']}`, data, config);
        } else {
            const data = {'address': body.subnet, 'dns-server': '8.8.8.8,8.8.4.4', 'gateway': firstUsableAddress.toString(), 'netmask': `${prefix}`}
            await axios.put(`${apiUrl}/ip/dhcp-server/network`, data, config);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Job Complete', data: ips.data})
        };
    } catch (err) {
        console.log(err);
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'An error occurred adding WiFi'})
    };
};

export const configureWifiMasterEthernetUplink = async (pathParameters: string[], body: { subnet: string, vlan: number }): Promise<APIGatewayProxyResult> => {
    const initResult = await initializeApiAccess(pathParameters);
    if (initResult.statusCode && initResult.body)
        return {statusCode: initResult.statusCode, body: initResult.body};

    const {config, apiUrl, asset} = initResult;
    const tenantId = pathParameters[0];
    const siteId = pathParameters[2];
    const site: Site | undefined = await getSiteFromDynamo(tenantId, siteId);

    if (site && site.wifiuplinkPSK) {

    } else if (site) {
        const psk = generatePassword(24);
        site.wifiuplinkPSK = psk;
        updateSite(site, tenantId, siteId);
    } else {
        return {statusCode: 400, body: JSON.stringify({message: 'Could not find site!'})}
    }

    try {

        const interfaces = await axios.get(`${apiUrl}/interface`, config);
        const wlan1 = interfaces.data.find((item: any) => item['default-name'] === 'wlan1');
        const wlan2 = interfaces.data.find((item: any) => item['default-name'] === 'wlan2');

        if (wlan1) {
            const data = {'disabled': 'yes'}
            await axios.patch(`${apiUrl}/interface/${wlan1['.id']}`, data, config);
        }
        if (wlan2) {
            const data = {'disabled': 'yes'}
            await axios.patch(`${apiUrl}/interface/${wlan2['.id']}`, data, config);
        }

        const bridges = await axios.get(`${apiUrl}/interface/bridge`, config);
        const bridgeNames = new Set(bridges.data.map((item: any) => item.name));
        const wifiAccessBridgeExists = bridgeNames.has('bridge-wifiaccess');

        if (!wifiAccessBridgeExists) {
            const data = {'name': 'bridge-wifiaccess', 'vlan-filtering': 'yes'};
            await axios.put(`${apiUrl}/interface/bridge`, data, config);
        }

        const bridgevlans = await axios.get(`${apiUrl}/interface/bridge/vlan`, config);
        const accessvlans = bridgevlans.data.find((item: any) => item['bridge'] === 'bridge-wifiaccess' && item['dynamic'] === 'false');
        const ulvlans = bridgevlans.data.find((item: any) => item['bridge'] === 'bridge');

        if (accessvlans) { //already exists
            const data = {'tagged': 'bridge-wifiaccess', 'vlan-ids': `${body.vlan}`};
            await axios.patch(`${apiUrl}/interface/bridge/vlan/${accessvlans['.id']}`, data, config);
        } else {
            const data = {'tagged': 'bridge-wifiaccess', 'vlan-ids': `${body.vlan}`, 'bridge': 'bridge-wifiaccess'};
            await axios.put(`${apiUrl}/interface/bridge/vlan`, data, config);
        }

        if (ulvlans) { //already exists
            const data = {'tagged': 'bridge', 'vlan-ids': `99`};
            await axios.patch(`${apiUrl}/interface/bridge/vlan/${ulvlans['.id']}`, data, config);
        } else {
            const data = {'tagged': 'bridge', 'vlan-ids': `99`, 'bridge': 'bridge'};
            await axios.put(`${apiUrl}/interface/bridge/vlan`, data, config);
        }

        const vlans = await axios.get(`${apiUrl}/interface/vlan`, config);
        const vlanif = vlans.data.find((item: any) => item['name'] === `vlan${body.vlan}`);
        const vlanulif = vlans.data.find((item: any) => item['name'] === `vlan99`);

        if (vlanif) { //already exists
            if (vlanif['interface'] !== 'bridge-wifiaccess') return {statusCode: 400, body: JSON.stringify({message: 'Fusion VLAN already exists on incorrect interface!'})};
            if (vlanif['vlan-id'] !== `${body.vlan}`) return {statusCode: 400, body: JSON.stringify({message: `VLAN ${body.vlan} exists and is mis-configured (wrong vlan id)`})};
        } else {
            const data = {'interface': 'bridge-wifiaccess', 'name': `vlan${body.vlan}`, 'vlan-id': `${body.vlan}`}
            await axios.put(`${apiUrl}/interface/vlan`, data, config);
        }

        if (vlanulif) { //already exists
            if (vlanulif['interface'] !== 'bridge') return {statusCode: 400, body: JSON.stringify({message: 'Uplink VLAN already exists on incorrect interface!'})};
            if (vlanulif['vlan-id'] !== `99`) return {statusCode: 400, body: JSON.stringify({message: `Uplink VLAN exists and is mis-configured (wrong vlan id - ${vlanulif['vlan-id']})`})};
        } else {
            const data = {'interface': 'bridge', 'name': `vlan99`, 'vlan-id': `99`}
            await axios.put(`${apiUrl}/interface/vlan`, data, config);
        }

        const intlists = await axios.get(`${apiUrl}/interface/list`, config);
        const fusionList = intlists.data.find((item: any) => item['name'] === 'FUSION');

        if(!fusionList){
            const data = {'name': 'FUSION'};
            await axios.put(`${apiUrl}/interface/list`, data, config);
        }

        const intlistmembers  = await axios.get(`${apiUrl}/interface/list/member`, config);
        const vlan99lan = intlistmembers.data.find((item: any) => item['interface'] === 'vlan99' && item['list'] === 'LAN');
        const vlan50lan = intlistmembers.data.find((item: any) => item['interface'] === 'vlan50' && item['list'] === 'FUSION');

        if(!vlan99lan){
            const data = {'interface': 'vlan99', 'list': 'LAN'};
            await axios.put(`${apiUrl}/interface/list/member`, data, config);
        }
        if(!vlan50lan){
            const data = {'interface': 'vlan50', 'list': 'FUSION'};
            await axios.put(`${apiUrl}/interface/list/member`, data, config);
        }

        const cmsec = await axios.get(`${apiUrl}/caps-man/security`, config);
        const fusioncmsec = cmsec.data.find((item: any) => item['name'] === 'fusion');

        if (fusioncmsec) {
            const data = {'authentication-types': 'wpa2-psk', 'name': 'fusion', 'passphrase': 'tkfusion'};
            await axios.patch(`${apiUrl}/caps-man/security/${fusioncmsec['.id']}`, data, config);
        } else {
            const data = {'authentication-types': 'wpa2-psk', 'name': 'fusion', 'passphrase': 'tkfusion'};
            await axios.put(`${apiUrl}/caps-man/security`, data, config);
        }

        const cmconf = await axios.get(`${apiUrl}/caps-man/configuration`, config);
        const fusioncmconf = cmconf.data.find((item: any) => item['name'] === 'fusion');

        if (fusioncmconf) {
            const data = {
                'channel.band': '2ghz-b/g/n', 'country': 'australia', 'datapath.bridge': 'bridge-wifiaccess',
                'datapath.vlan-id': `${body.vlan}`, 'datapath.vlan-mode': 'use-tag', 'mode': 'ap', 'name': 'fusion',
                'security': 'fusion', 'ssid': 'tkfusion'
            }
            await axios.patch(`${apiUrl}/caps-man/configuration/${fusioncmconf['.id']}`, data, config);
        } else {
            const data = {
                'channel.band': '2ghz-b/g/n', 'country': 'australia', 'datapath.bridge': 'bridge-wifiaccess',
                'datapath.vlan-id': `${body.vlan}`, 'datapath.vlan-mode': 'use-tag', 'mode': 'ap', 'name': 'fusion',
                'security': 'fusion', 'ssid': 'tkfusion'
            }
            await axios.put(`${apiUrl}/caps-man/configuration`, data, config);
        }

        const data = {'enabled': 'yes'};
        await axios.post(`${apiUrl}/caps-man/manager/set`, data, config);

        const cmint = await axios.get(`${apiUrl}/caps-man/manager/interface`, config);
        const cmintethbridge = cmint.data.find((item: any) => item['interface'] === 'vlan99');
        const cmallint = cmint.data.find((item: any) => item['interface'] === 'all');

        if (cmintethbridge) {
            const data = {'disabled': 'no'};
            await axios.patch(`${apiUrl}/caps-man/manager/interface/${cmintethbridge['.id']}`, data, config);
        } else {
            const data = {'disabled': 'no', 'interface': 'vlan99'};
            await axios.put(`${apiUrl}/caps-man/manager/interface`, data, config);
        }

        if (cmallint) {
            const data = {'forbid': 'yes'}
            await axios.patch(`${apiUrl}/caps-man/manager/interface/${cmallint['.id']}`, data, config);
        }

        const provisioning = await axios.get(`${apiUrl}/caps-man/provisioning`, config);
        const provfusion = provisioning.data.find((item: any) => item['master-configuration'] === 'fusion');

        if (provfusion) {
            const data = {'action': 'create-enabled'};
            await axios.patch(`${apiUrl}/caps-man/provisioning/${provfusion['.id']}`, data, config);
        } else {
            const data = {'action': 'create-enabled', 'master-configuration': 'fusion'};
            await axios.put(`${apiUrl}/caps-man/provisioning`, data, config);
        }

        const ips = await axios.get(`${apiUrl}/ip/address`, config);
        const uplinkip = ips.data.find((item: any) => item.interface === 'vlan99');
        const accessip = ips.data.find((item: any) => item.interface === `vlan${body.vlan}`);

        if (!uplinkip) {
            const data = {'address': '192.168.99.1/30', 'interface': 'vlan99', 'network': '192.168.99.0'}
            await axios.put(`${apiUrl}/ip/address`, data, config);
        }
        const {prefix, networkAddress, firstUsableAddress, remainingUsable} = getSubnetInfo(body);
        if (!accessip) {
            const data = {'address': `${firstUsableAddress}/${prefix}`, 'interface': `vlan${body.vlan}`, 'network': `${networkAddress}`}
            await axios.put(`${apiUrl}/ip/address`, data, config);
        }

        const pools = await axios.get(`${apiUrl}/ip/pool`, config);
        const fusionpool = pools.data.find((item: any) => item['name'] === 'fusion');
        if (fusionpool) {
            const data = {'ranges': remainingUsable};
            await axios.patch(`${apiUrl}/ip/pool/${fusionpool['.id']}`, data, config);
        } else {
            const data = {'name': 'fusion', 'ranges': remainingUsable};
            await axios.put(`${apiUrl}/ip/pool`, data, config);
        }

        const dhcpservs = await axios.get(`${apiUrl}/ip/dhcp-server`, config);
        const fusionserv = dhcpservs.data.find((item: any) => item['name'] === 'fusion');
        if (fusionserv) {
            const data = {'interface': `vlan${body.vlan}`, 'address-pool': 'fusion'};
            await axios.patch(`${apiUrl}/ip/dhcp-server/${fusionserv['.id']}`, data, config);
        } else {
            const data = {'name': 'fusion', 'interface': `vlan${body.vlan}`, 'address-pool': 'fusion'};
            await axios.put(`${apiUrl}/ip/dhcp-server`, data, config);
        }

        const dhcpnets = await axios.get(`${apiUrl}/ip/dhcp-server/network`, config);
        const accessnet = dhcpnets.data.find((item: any) => item['address'] === body.subnet);

        if (accessnet) {
            const data = {'dns-server': '8.8.8.8,8.8.4.4', 'gateway': firstUsableAddress.toString(), 'netmask': `${prefix}`}
            await axios.patch(`${apiUrl}/ip/dhcp-server/network/${accessnet['.id']}`, data, config);
        } else {
            const data = {'address': body.subnet, 'dns-server': '8.8.8.8,8.8.4.4', 'gateway': firstUsableAddress.toString(), 'netmask': `${prefix}`}
            await axios.put(`${apiUrl}/ip/dhcp-server/network`, data, config);
        }

        const routes = await axios.get(`${apiUrl}/ip/route`, config);
        const apIP = decrementThirdOctetSimple(asset!.loopbacks[0].getFirst().toString());
        const aproute = routes.data.find((item: any) => item['dst-address'] === `${apIP}/32`);

        if (!aproute) {
            const data = {'dst-address': `${apIP}/32`, 'gateway': `192.168.99.2`, 'disabled': 'no'};
            await axios.put(`${apiUrl}/ip/route`, data, config);
        }

        const fwrules = await axios.get(`${apiUrl}/ip/firewall/filter`, config);
        const apMgmtRule = fwrules.data.find((item: any) => item['comment'] === 'Allow AP Management');
        const dropRule = fwrules.data.find((item: any) => item['comment'] === 'Drop all other inbound');
        const dropFKRule = fwrules.data.find((item: any) => item['comment'] === 'Drop Fusion to Keno Traffic');
        const dropKFRule = fwrules.data.find((item: any) => item['comment'] === 'Drop Keno to Fusion Traffic');
        const allowFNTPRule = fwrules.data.find((item: any) => item['comment'] === 'Allow Fusion NTP');
        const dropFRFCRule = fwrules.data.find((item: any) => item['comment'] === 'Drop Fusion to private networks');


        if (apMgmtRule) {
            const data = {
                'action': 'accept', 'chain': 'forward', 'in-interface-list': 'WAN', 'protocol': 'tcp',
                'dst-port': '8728,21,22,8291,443', 'src-address-list': 'management_hosts',
                'dst-address': `${apIP}`
            };
            await axios.patch(`${apiUrl}/ip/firewall/filter/${apMgmtRule['.id']}`, data, config);
        } else {
            const data = {
                'action': 'accept', 'chain': 'forward', 'comment': 'Allow AP Management', 'in-interface-list': 'WAN',
                'protocol': 'tcp', 'dst-port': '8728,21,22,8291,443', 'src-address-list': 'management_hosts',
                'place-before': `${dropRule['.id']}`, 'dst-address': `${apIP}`
            };
            await axios.put(`${apiUrl}/ip/firewall/filter`, data, config);
        }

        if (dropFKRule) {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'FUSION', 'out-interface-list': 'LAN'
            };
            await axios.patch(`${apiUrl}/ip/firewall/filter/${dropFKRule['.id']}`, data, config);
        } else {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'FUSION', 'out-interface-list': 'LAN',
                'comment': 'Drop Fusion to Keno Traffic'
            };
            await axios.put(`${apiUrl}/ip/firewall/filter`, data, config);
        }

        if (dropKFRule) {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'LAN', 'out-interface-list': 'FUSION'
            };
            await axios.patch(`${apiUrl}/ip/firewall/filter/${dropKFRule['.id']}`, data, config);
        } else {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'LAN', 'out-interface-list': 'FUSION',
                'comment': 'Drop Keno to Fusion Traffic'
            };
            await axios.put(`${apiUrl}/ip/firewall/filter`, data, config);
        }

        if (allowFNTPRule) {
            const data = {
                'action': 'accept', 'chain': 'forward', 'in-interface-list': 'FUSION', 'out-interface-list': 'WAN',
                'dst-address': '10.10.1.1', 'dst-port': '123', 'protocol': 'udp'
            };
            await axios.patch(`${apiUrl}/ip/firewall/filter/${allowFNTPRule['.id']}`, data, config);
        } else {
            const data = {
                'action': 'accept', 'chain': 'forward', 'in-interface-list': 'FUSION', 'out-interface-list': 'WAN',
                'comment': 'Allow Fusion NTP', 'dst-address': '10.10.1.1', 'dst-port': '123', 'protocol': 'udp'
            };
            await axios.put(`${apiUrl}/ip/firewall/filter`, data, config);
        }

        if (dropFRFCRule) {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'FUSION',
                'dst-address-list': 'rfc1918', 'out-interface-list': 'WAN'
            };
            await axios.patch(`${apiUrl}/ip/firewall/filter/${dropFRFCRule['.id']}`, data, config);
        } else {
            const data = {
                'action': 'drop', 'chain': 'forward', 'in-interface-list': 'FUSION',
                'dst-address-list': 'rfc1918', 'out-interface-list': 'WAN',
                'comment': 'Drop Fusion to private networks'
            }
            await axios.put(`${apiUrl}/ip/firewall/filter`, data, config);
        }





        const fwaddlists = await axios.get(`${apiUrl}/ip/firewall/address-list`, config);
        const rfc1918_10 = fwaddlists.data.find((item: any) => item['address'] === '10.0.0.0/8' && item['list'] === 'rfc1918');
        const rfc1918_172 = fwaddlists.data.find((item: any) => item['address'] === '172.16.0.0/12');
        const rfc1918_192 = fwaddlists.data.find((item: any) => item['address'] === '192.168.0.0/16');

        if(!rfc1918_10){
            const data = {'address': '10.0.0.0/8', 'list': 'rfc1918'}
            await axios.put(`${apiUrl}/ip/firewall/address-list`, data, config);
        }
        if(!rfc1918_172){
            const data = {'address': '172.16.0.0/12', 'list': 'rfc1918'}
            await axios.put(`${apiUrl}/ip/firewall/address-list`, data, config);
        }
        if(!rfc1918_192){
            const data = {'address': '192.168.0.0/16', 'list': 'rfc1918'}
            await axios.put(`${apiUrl}/ip/firewall/address-list`, data, config);
        }



        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Wifi Added via Ethernet Uplink', data: ips.data})
        };
    } catch (err) {
        console.log(err);
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'An error occurred adding WiFi'})
    };
};

interface SubnetInfo {
    vlan: number;
    prefix: number;
    networkAddress: IPv4;
    firstUsableAddress: IPv4;
    remainingUsable: string; // now a string range
}

function decrementThirdOctetSimple(ipString: string): string {
    const parts = ipString.split('.');
    const third = parseInt(parts[2], 10);
    if (third === 0) {
        throw new Error(`Cannot decrement the third octet (already 0) for IP: ${ipString}`);
    }
    parts[2] = (third - 1).toString();
    return parts.join('.');
}

function getSubnetInfo({subnet, vlan}: { subnet: string; vlan: number }): SubnetInfo {
    // Parse the given CIDR subnet
    const range = IPv4CidrRange.fromCidr(subnet);
    const prefix: number = Number(range.getPrefix().getValue());

    // The first address in the range is the network address
    const networkAddressNum = range.getFirst().getValue();
    // The last address in the range is the broadcast address
    const broadcastAddressNum = range.getLast().getValue();

    // First usable address is one after the network address
    // Last usable address is one before the broadcast address
    const firstUsableNum = networkAddressNum + 1n;
    const lastUsableNum = broadcastAddressNum - 1n;

    // Create the IPv4 objects
    const networkAddress = IPv4.fromNumber(networkAddressNum);
    const firstUsableAddress = IPv4.fromNumber(firstUsableNum);

    // Format the remaining usable addresses as a single range string
    // starting from firstUsableNum+1 (the address after the first usable)
    // up to lastUsableNum (the last usable).
    // If the subnet is large, this is still just a simple string range.
    const secondUsableNum = firstUsableNum + 1n;
    const lastUsableAddress = IPv4.fromNumber(lastUsableNum);

    let remainingUsable = '';
    // Only create the range if there's more than one host after the first usable
    if (secondUsableNum <= lastUsableNum) {
        const secondUsableAddress = IPv4.fromNumber(secondUsableNum);
        remainingUsable = `${secondUsableAddress.toString()}-${lastUsableAddress.toString()}`;
    }

    return {
        vlan,
        prefix,
        networkAddress,
        firstUsableAddress,
        remainingUsable
    };
}

const updateSite = async (site: Site, tenantId: string, siteId: string): Promise<APIGatewayProxyResult> => {
    const params: UpdateCommandInput = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `SITE#${siteId}`
        },
        UpdateExpression: 'set #data = :data, #name = :name, #id = :id',
        ConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
            ':data': site,
            ':name': site.name,
            ':id': site.id,
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
        await dynamoDbClient.send(new UpdateCommand(params));
    } catch (error: any) {
        console.log(`Error Occurred: ${JSON.stringify(error, null, 2)}`);
        if (error.name === 'ConditionalCheckFailedException') {
            console.log('Trying Put');
        }
        try {
            const store = {
                pk: `TENANT#${tenantId}`,
                sk: `SITE#${siteId}`,
                tenantId: tenantId,
                name: site.name,
                id: site.id,
                data: site
            };

            const putParams: PutCommandInput = {
                TableName: TABLE_NAME,
                Item: store
            };
            await dynamoDbClient.send(new PutCommand(putParams));
        } catch (putError) {
            throw new Error('Could not save site');
        }
    }

    return {statusCode: 200, body: JSON.stringify({message: 'Update completed successfully'})};
};

function generatePassword(length: number = 24): string {
    if (length < 4) {
        throw new Error('Password length should be at least 4 characters to include all character types.');
    }

    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    // Matches Python's `string.punctuation`:
    const special = `!"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~`;

    // Ensure the password contains at least one character from each pool
    const password: string[] = [
        getRandomChar(upper),
        getRandomChar(lower),
        getRandomChar(digits),
        getRandomChar(special)
    ];

    // Fill the rest of the password length with random choices from all pools
    const allCharacters = upper + lower + digits + special;
    for (let i = 0; i < length - 4; i++) {
        password.push(getRandomChar(allCharacters));
    }

    // Shuffle the list in-place
    shuffle(password);

    // Convert list to string and return
    return password.join('');
}

function getRandomChar(str: string): string {
    const randomIndex = Math.floor(Math.random() * str.length);
    return str.charAt(randomIndex);
}

function shuffle(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export const reboot = async (pathParameters: string[]): Promise<APIGatewayProxyResult> => {
    const initResult = await initializeApiAccess(pathParameters);
    if (initResult.statusCode && initResult.body)
        return {statusCode: initResult.statusCode, body: initResult.body};

    const {config, apiUrl} = initResult;
    const data = {};
    try {
        await axios.post(`${apiUrl}/system/reboot`, data, config);
        console.log('Reboot submitted successfully');
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Reboot submitted'})
        };
    } catch (err) {
        console.log(err);
    }

    return {
        statusCode: 400,
        body: JSON.stringify({message: 'Reboot unsuccessful'})
    };
};
