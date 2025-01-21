import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import {activateAsset} from './activate_asset';
import {getChartData} from './chart';
import {addWiFiMaster, commissionAsset, commissionAssetCred, configureWifiMasterEthernetUplink, reboot, resetUSB, updateSNMP, updateTZ} from './apicalls';
import {processConfigRequest} from './config';
import {flushCache, getAtAGlance} from './devicemonitor';
import {generateInvoicesForTenant} from './invoice-generator';
import {createAsset} from './modemcreate';
import {processKenoChildRequest} from './tenant.child';
import {xeroredirect} from './xeroredirect';

const ddbClient = new DynamoDBClient({region: process.env.AWS_REGION});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
const DEFAULT_HEADERS = {'Access-Control-Allow-Origin': '*'};

export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const role = event.requestContext.authorizer?.role;
    const response: APIGatewayProxyResult = {statusCode: 200, body: '', headers: DEFAULT_HEADERS};
    const pathComponents = event.pathParameters?.proxy?.split('/').filter(Boolean) || [];

    const body = JSON.parse(event.body!);
    const [tenantId, resourceType, resourceId, action] = pathComponents;

    if (pathComponents.length < 2) {
        if (tenantId === 'xeroredirect' && event.httpMethod === 'POST') {
            return {...response, ...await xeroredirect(event)};
        }

        return {...response, statusCode: 404, body: JSON.stringify({message: 'Command not found'})};
    }

    // Check for special routes that rely on resourceType but also have unique conditions

    if (resourceType === 'flushcache') {
        if (role !== 'admin') {
            return {...response, statusCode: 403, body: JSON.stringify({message: 'Forbidden'})};
        }
        return {...response, ...await flushCache(event)};
    }

    // Use a switch for resourceType
    switch (resourceType) {
        case 'tenant':
            return {
                ...response,
                ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'TENANT', -1, role!)
            };
        case 'site':
            switch (action) {
                case 'commission':
                    return {...response, ...await commissionAsset(pathComponents)};
                case 'commissioncred':
                    return {...response, ...await commissionAssetCred(pathComponents)};
                case 'activateasset':
                    return {...response, ...await activateAsset(pathComponents, true, body)};
                case 'deactivateasset':
                    return {...response, ...await activateAsset(pathComponents, false, body)};
                case 'asset':
                    return {
                        ...response,
                        ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'SITE#', 'ASSET#', 2, role!)
                    };
                case 'assetchart':
                    return {...response, ...await getChartData(body)};
                case 'assetconfig': {
                    const routerDetails = await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'SITE#', 'ASSET#', 2, role!);
                    const siteDetails = await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'SITE#', 0, role!);
                    const bucketName: string = process.env.S3_CONFIG_BUCKET!;

                    const router = JSON.parse(routerDetails.body);
                    console.log(router);

                    const configResponse = await processConfigRequest(
                        bucketName,
                        router.hostname.endsWith('mcac') ? 'mikrotik-cAP-fusion.config': 'mikrotik-lte6-keno.config',
                        JSON.parse(routerDetails.body),
                        JSON.parse(siteDetails.body)
                    );
                    return {
                        ...response,
                        ...configResponse,
                        headers: {...configResponse.headers, ...DEFAULT_HEADERS, 'Content-Type': 'text/plain'}
                    };
                }
                case 'snmpupdate':
                    return {...response, ...await updateSNMP(pathComponents)};
                case 'updatetz':
                    return {...response, ...await updateTZ(pathComponents)};
                case 'resetusb':
                    return {...response, ...await resetUSB(pathComponents)};
                case 'reboot':
                    return {...response, ...await reboot(pathComponents)};
                case 'newmodem':
                    return {...response, ...await createAsset(body, pathComponents, TABLE_NAME)};
                case 'wifi':
                    return {...response, ...await (configureWifiMasterEthernetUplink(pathComponents, body))}
                default:
                    return {
                        ...response,
                        ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'SITE#', 0, role!)
                    };
            }
        case 'asset':
            switch (action) {
                case 'comment':
                    return {
                        ...response,
                        ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'ASSET#', 'COMMENT#', 2, role!)
                    };
            }
            break;
        case 'rate':
            return {
                ...response,
                ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'RATE#', 0, role!)
            };
        case 'resetusb':
            return {...response, ...await resetUSB(pathComponents)};
        case 'invoice':
            if (event.httpMethod === 'POST') {
                if (role !== 'admin') {
                    return {...response, statusCode: 403, body: JSON.stringify({message: 'Forbidden'})};
                }
                return {
                    ...response,
                    ...await generateInvoicesForTenant(tenantId, body.startDate, body.endDate, TABLE_NAME, body.invoiceDate, body.overdueAmount)
                };
            }
        case 'monitor':
            return {...response, ...await getAtAGlance(event)};
    }

    return {...response, statusCode: 404, body: JSON.stringify({message: 'Command not found.'})};
};
