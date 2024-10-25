import {SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand} from '@aws-sdk/client-secrets-manager';
import axios from 'axios';

const secretsManager = new SecretsManagerClient({region: process.env.AWS_REGION});
const secretName = 'xero-api-tokens';
const clientId = 'B0E35429D87C4BD69BBE1BE7195D49A0';
const clientSecret = 'FxARTsteP8wKJwcmcypPH1S9NV2zZBzcUFYU2NhI0uInlAUD';
const tokenUrl = 'https://identity.xero.com/connect/token';
const invoiceUrl = 'https://api.xero.com/api.xro/2.0/Invoices';
const connectionsUrl = 'https://api.xero.com/connections';

async function getTokens() {
    const command = new GetSecretValueCommand({SecretId: secretName});
    const secret = await secretsManager.send(command);
    if (!secret.SecretString) throw new Error('No secret found');
    return JSON.parse(secret.SecretString);
}

async function updateTokens(tokens: any) {
    console.log(`Updating Tokens ${JSON.stringify(tokens, null, 2)}`);
    const command = new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: JSON.stringify(tokens)
    });
    await secretsManager.send(command);
}

async function refreshAccessToken(refreshToken: string) {
    const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret
        }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    const newTokens = response.data;
    console.log('Tokens refreshed:', JSON.stringify(newTokens, null, 2));
    await updateTokens(newTokens);
    return newTokens.access_token;
}

async function getTenantId(accessToken: string, refresh_token: string): Promise<string> {
    try {

        const response = await axios.get(connectionsUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.length === 0) {
            throw new Error('No tenants found for this access token');
        }

        return response.data[0].tenantId;
    }catch(error: any) {
        if (error.response && error.response.status === 401) {
            // Handle token expiration
            console.log('Access token expired, refreshing...');
            const access_token = await refreshAccessToken(refresh_token);
            const response = await axios.get(connectionsUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.length === 0) {
                throw new Error('No tenants found for this access token');
            }

            return response.data[0].tenantId;
        }
    }
    return '';
}

async function makeApiRequest(url: string, data: any, accessToken: string, tenantId: string) {
    return axios.post(url, data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Xero-Tenant-Id': tenantId
        }
    });
}

export async function createXeroInvoice(): Promise<{ invoiceId: string, invoiceNumber: string }> {
    console.log(1);
    let {access_token, refresh_token} = await getTokens();
    console.log(2);
    let tenantId = await getTenantId(access_token, refresh_token);
    console.log(3);
    const invoiceData = {
        Type: 'ACCREC',
        Contact: {
            Name: 'Federal Group'
        },
        Date: new Date().toISOString().split('T')[0],
        DueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        LineItems: [
            {
                Description: 'Managed Network Services',
                Quantity: 1.0,
                UnitAmount: 150.0,
                AccountCode: '200'
            }
        ],
        Status: 'AUTHORISED'
    };

    try {
        const response = await makeApiRequest(invoiceUrl, invoiceData, access_token, tenantId);
        console.log('Invoice created:', response.data);
        return {invoiceId: response.data.Invoices[0].InvoiceID, invoiceNumber: response.data.Invoices[0].InvoiceNumber}
    } catch (error: any) {
        if (error.response && error.response.status === 401) {
            // Handle token expiration
            console.log('Access token expired, refreshing...');
            access_token = await refreshAccessToken(refresh_token);
            tenantId = await getTenantId(access_token, refresh_token);

            try {
                const response = await makeApiRequest(invoiceUrl, invoiceData, access_token, tenantId);
                console.log('Invoice created after token refresh:', response.data);
                return {invoiceId: response.data.Invoices[0].InvoiceID, invoiceNumber: response.data.Invoices[0].InvoiceNumber}
            } catch (retryError) {
                console.error('Error creating invoice after token refresh:', retryError);
            }
        } else {
            console.error('Error creating invoice:', error);
        }
    }
    return {invoiceId: '', invoiceNumber: ''};
}
