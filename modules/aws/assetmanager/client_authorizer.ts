import axios, { AxiosResponse } from "axios";
import jwt, { VerifyOptions } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

interface PolicyDocument {
    Version: string;
    Statement: {
        Action: string;
        Effect: string;
        Resource: string;
    }[];
}

interface AuthResponse {
    principalId: string;
    policyDocument?: PolicyDocument;
    context: {
        [key: string]: string;
    };
}

interface Authorization {
    tenant: string;
    role: string;
}

exports.lambdaHandler = async (event: any): Promise<AuthResponse> => {
    const token = event.headers.Authorization;
    const jwksUrl = process.env.JWKS_URL!;
    const decoded = jwt.decode(token, { complete: true });
    const kid: string | undefined = decoded?.header?.kid;

    try {
        const response: AxiosResponse<any, any> = await axios.get(jwksUrl);
        const jwks = response.data.keys as any[];
        const jwk = jwks.find((item) => item.kid === kid);
        const pem: string = jwkToPem(jwk);

        try {
            console.log(token);
            const decoded = await verifyToken(token, pem);
            console.log('decoded');
            if (decoded) {
                if (decoded["custom:authorization"]) {

                    const assocs = JSON.parse(decoded["custom:authorization"]) as Authorization[];
                    console.log(assocs);
                    const pathComponents = event.pathParameters.proxy?.split('/').filter(Boolean) || [];
                    for (let i = 0; i < assocs.length; i++) {
                        const assoc = assocs[i];
                        if ((pathComponents[0] && assoc.tenant === pathComponents[0]) || assoc.tenant === '25dabc20-b2de-47b2-87c6-a596061750a9') {
                            return generatePolicy('user', 'Allow', event.methodArn, {role: assoc.role});
                        }
                    }
                }
                console.log('deny1');
                return generatePolicy('user', 'Deny', event.methodArn, {});
            }
        } catch (error) {
            console.log(JSON.stringify(error, null, 2));
            console.log('deny2');
            return generatePolicy('user', 'Deny', event.methodArn,{});
        }

    } catch (error) {
        console.error('Error fetching public key:', error);
    }
    console.log('deny3');
    return generatePolicy('user', 'Deny', event.methodArn, {});
};

async function verifyToken(token: string, pem: string): Promise<any> {
    const verifyOptions: VerifyOptions = {
        algorithms: ['RS256'],
    };
    try {
        return new Promise((resolve, reject) => {
            jwt.verify(token, pem, verifyOptions, (err: any, decoded: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
    } catch (error) {
        throw error;
    }
}

const generatePolicy = (principalId: string, effect: string, resource: string, context: any): AuthResponse => {
    const policyDocument: PolicyDocument = {
        Version: '2012-10-17',
        Statement: [{
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
        }]
    };
    return {
        principalId: principalId,
        policyDocument: policyDocument,
        context: context
    };
};
