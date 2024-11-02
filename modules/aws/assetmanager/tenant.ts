import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import {activateAsset} from './activate_asset';
import {getChartData} from './chart';
import {commissionAsset, commissionAssetCred, updateSNMP} from './commission';
import {processConfigRequest} from './config';
import {flushCache, getAtAGlance} from './devicemonitor';
import {generateInvoicesForTenant} from './invoice-generator';
import {createAsset} from './modemcreate';
import {processKenoChildRequest} from './tenant.child';
import {xeroredirect} from './xeroredirect';

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
const ddbClient: DynamoDBClient = new DynamoDBClient({region: process.env.AWS_REGION});
const TABLE_NAME: string = process.env.DYNAMODB_TABLE!;
export const lambdaHandler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const role: string = event.requestContext.authorizer!.role;
    const response: APIGatewayProxyResult = {statusCode: 200, body: '', headers: {'Access-Control-Allow-Origin': '*'}};
    let pathComponents: string[] = [];
    if (event.pathParameters?.proxy) {
        pathComponents = event.pathParameters.proxy.split('/').filter(Boolean);
    }
    const body = JSON.parse(event.body!);
    if ((pathComponents.length >= 2)) {
        if (pathComponents[1] === 'tenant')
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'TENANT', -1, role)};

        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'commission'))
            return {...response, ...await commissionAsset(pathComponents)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'commissioncred'))
            return {...response, ...await commissionAssetCred(pathComponents)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'activateasset'))
            return {...response, ...await activateAsset(pathComponents, true, event.body)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'deactivateasset'))
            return {...response, ...await activateAsset(pathComponents, false, event.body)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'asset'))
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'SITE#', 'ASSET#', 2, role)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'assetchart'))
            return {...response, ...await getChartData(body)};
        else if ((pathComponents[1] === 'asset') && (pathComponents[3] === 'comment'))
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'ASSET#', 'COMMENT#', 2, role)};
        else if ((pathComponents[1] === 'rate'))
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'RATE#', 0, role)};
        else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'assetconfig')) {
            const routerDetails = await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'SITE#', 'ASSET#', 2, role);
            const siteDetails = await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'SITE#', 0, role);
            const bucketName: string = process.env.S3_CONFIG_BUCKET!;
            const r = {...response, ...await processConfigRequest(bucketName, 'mikrotik-lte6-keno.config', JSON.parse(routerDetails.body), JSON.parse(siteDetails.body))};
            r.headers = {...r.headers, 'Content-Type': 'text/plain'}
            return r;
        } else if ((pathComponents[1] === 'site') && (pathComponents[3] === 'snmpupdate'))
            return {...response, ...await updateSNMP(pathComponents)};
        else if ((pathComponents[1]=== 'site')&&(pathComponents[3] === 'newmodem'))
            return {...response, ...await createAsset(body, pathComponents, TABLE_NAME)}
        else if (pathComponents[1] === 'site')
            return {...response, ...await processKenoChildRequest(event.httpMethod, body, pathComponents, TABLE_NAME, ddbClient, 'TENANT#', 'SITE#', 0, role)};

    }

    if (pathComponents[1] === 'invoice' && event.httpMethod === 'POST') {
        if (role !== 'admin') {
            return {...response, ...{statusCode: 403, body: JSON.stringify({message: 'Forbidden'})}};
        }
        return {...response, ...await generateInvoicesForTenant(pathComponents[0], body.startDate, body.endDate, TABLE_NAME, body.invoiceDate, body.overdueAmount)};
    }

    if (pathComponents[0] === 'xeroredirect' && event.httpMethod === 'POST') {
        return {...response, ...await xeroredirect(event)};
    }

    if (pathComponents[1] === 'monitor') {
        return {...response, ...await getAtAGlance(event)};
    }

    if (pathComponents[1] === 'flushcache') {
        if (role !== 'admin') {
            return {...response, ...{statusCode: 403, body: JSON.stringify({message: 'Forbidden'})}};
        }
        return {...response, ...await flushCache(event)}
    }

    if (!event.body) {
        response.statusCode = 400;
        response.body = JSON.stringify({message: event});
        return response;
    }
    response.body = JSON.stringify({message: 'It works! Well done!'});
    return response;
};
