import {SecretsManagerClient, PutSecretValueCommand} from "@aws-sdk/client-secrets-manager";
import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import axios from 'axios';
import * as qs from 'qs';
import {Buffer} from 'buffer';

const secretsManager = new SecretsManagerClient({region: process.env.AWS_REGION});
const secretName = "xero-api-tokens";

export const xeroredirect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Parse the incoming request body
        const {code, scope, state} = JSON.parse(event.body || '{}');

        if (!code || !scope) {
            return {
                statusCode: 400,
                body: JSON.stringify({message: "Authorization Code is Required"})
            };
        }

        const data: any | null = await exchangeAuthCodeForTokens(code);

        if (!data)
            return {
                statusCode: 400,
                body: JSON.stringify({message: "An unexpected error occurred"})
            };

        // Prepare the secret value to be stored
        const secretValue = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            scope: data.scope,
            lastUpdated: new Date().toISOString()
        };

        // Store the tokens in Secrets Manager
        const putSecretValueCommand = new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify(secretValue)
        });

        await secretsManager.send(putSecretValueCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({message: "Tokens stored successfully"})
        };
    } catch (error) {
        console.error("Error storing tokens:", error);

        return {
            statusCode: 500,
            body: JSON.stringify({message: "Internal Server Error"})
        };
    }

// Define the necessary variables


// Function to perform the token exchange
    async function exchangeAuthCodeForTokens(authCode: string): Promise<any | null> {
        const clientId = 'B0E35429D87C4BD69BBE1BE7195D49A0';
        const clientSecret = 'FxARTsteP8wKJwcmcypPH1S9NV2zZBzcUFYU2NhI0uInlAUD';
        const redirectUri = 'https://logo.blacksaltit.com.au/xero/redirect.html';
        console.log(authCode);
        try {
            // Encode client ID and client secret in Base64
            console.log(clientId);
            console.log(clientSecret);
            const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
            console.log(encodedCredentials);
            // Prepare the request headers
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${encodedCredentials}`
            };
            console.log(headers);

            // Prepare the request body
            const data = qs.stringify({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: redirectUri
            });

            console.log(data);

            // Send the POST request to the Xero token endpoint
            const response = await axios.post('https://identity.xero.com/connect/token', data, {headers});

            // Log the received tokens
            console.log('Tokens received:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error exchanging auth code for tokens:', error);
            return null;
        }
    }

};
