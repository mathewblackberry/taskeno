import {GetObjectCommand, GetObjectCommandOutput, S3} from "@aws-sdk/client-s3";
import {APIGatewayProxyResult} from 'aws-lambda';
import {IPv4, IPv4CidrRange} from 'ip-num';
import {Readable} from 'stream';
import {Asset, Site} from './model';

interface Config {
    [key: string]: any;
}

const s3: S3 = new S3({region: process.env.AWS_REGION});

export const processConfigRequest = async (s3Bucket: string, s3Path: string, asset: Asset, site: Site): Promise<APIGatewayProxyResult> => {
    let asset2: any = asset;
    asset2.site = site;
    const config: string = await readFileFromS3(s3Bucket, s3Path);
    const result = substituteVariables(config, asset2);
    return {statusCode: 200, body: result};
};

async function readFileFromS3(bucketName: string, key: string): Promise<string> {
    try {
        const command: GetObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: key
        });

        const response: GetObjectCommandOutput = await s3.send(command);
        if (response.Body) {
            const streamToString = (stream: Readable) =>
                new Promise<string>((resolve, reject) => {
                    const chunks: Uint8Array[] = [];
                    stream.on("data", (chunk) => chunks.push(chunk));
                    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
                    stream.on("error", reject);
                });

            return await streamToString(response.Body as Readable);
        } else {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error("Empty response body");
        }
    } catch (error) {
        console.error("Error reading file from S3:", error);
        throw error;
    }
}

const dropsubnet = (cidr: string): string => {
    const [ipAddress] = cidr.split('/');
    // Return the IP address part
    return ipAddress;
};

const ipplus = (ip: string, n: number): string => {
    const parts = ip.split('.');
    parts[3] = (parseInt(parts[3]) + n).toString();
    return parts.join('.');
};

const numipplus = (ip: string, n: number): string => {
    const parts = ip.split('.');
    const ans = (parseInt(parts[3]) + n).toString();
    console.log(ans);
    return ans;
};

const cidripplussubnet = (cidr: string, n: number): string => {
    const [ipAddress, subnet] = cidr.split('/');
    const parts = ipAddress.split('.');
    parts[3] = (parseInt(parts[3]) + n).toString();
    return parts.join('.') + '/' + subnet;
};

const findnetworkip = (cidr_string: string): string => {
    const cidr: IPv4CidrRange = IPv4CidrRange.fromCidr(cidr_string);
    return cidr.getFirst().toString();
};

const findnetworkipplus = (cidr_string: string, n: number): string => {
    console.log(cidr_string);
    console.log(n);
    const cidr: IPv4CidrRange = IPv4CidrRange.fromCidr(cidr_string);
    let finalip: IPv4 = cidr.getFirst();
    for (let i = 0; i < n; i++){
        console.log(finalip.toString());
        finalip = finalip.nextIPNumber()
    }
    console.log(finalip.toString());
    return finalip.toString();
};





const functions: { [key: string]: (config: Config, args: string[]) => string } = {
    ipplus: (config: Config, args: string[]): string => {
        const [ipKey, increment] = args;
        const ipValue = getValue(config, ipKey);
        if (typeof ipValue === 'string') {
            return ipplus(ipValue, parseInt(increment));
        }
        return '';
    },
    numipplus: (config: Config, args: string[]): string => {
        const [ipKey, increment] = args;
        const ipValue = getValue(config, ipKey);
        if (typeof ipValue === 'string') {
            return numipplus(ipValue, parseInt(increment));
        }
        return '';
    },
    cidripplussubnet: (config: Config, args: string[]): string => {
        const [ipKey, increment] = args;
        const cidr = getValue(config, ipKey);
        if (typeof cidr === 'string') {
            return cidripplussubnet(cidr, parseInt(increment));
        }
        return '';
    },
    dropsubnet: (config: Config, args: string[]): string => {
        const [ipKey] = args;
        const cidr = getValue(config, ipKey);
        if (typeof cidr === 'string') {
            return dropsubnet(cidr);
        }
        return '';
    },
    findnetworkip: (config: Config, args: string[]): string => {
        const [ipKey] = args;
        const cidr = getValue(config, ipKey);
        if (typeof cidr === 'string') {
            return findnetworkip(cidr);
        }
        return '';
    },
    findnetworkipplus: (config: Config, args: string[]): string => {
        const [ipKey, increment] = args;
        const cidr = getValue(config, ipKey);
        if (typeof cidr === 'string') {
            return findnetworkipplus(cidr, parseInt(increment));
        }
        return '';
    }
    // Add more functions here as needed
};

const getValue = (config: Config, key: string): any => {
    const keys = key.split(/[.\[\]]/).filter(Boolean);
    return keys.reduce((acc, k) => acc && acc[k], config);
};

const substituteVariables = (template: string, config: Config): string => {
    return template.replace(/{{(.*?)}}/g, (_, expression) => {
        const functionMatch = expression.match(/^(\w+)\((.*?)\)$/);
        if (functionMatch) {
            console.log(functionMatch);
            const [, functionName, args] = functionMatch;
            const argArray = args.split(',').map((arg: string) => arg.trim());
            if (functions[functionName]) {
                console.log(functions[functionName]);
                return functions[functionName](config, argArray);
            }
        } else {
            const value = getValue(config, expression);
            return value !== undefined ? value.toString() : '';
        }
        return '';
    });
};

// const main = async () => {
//     const templatePath = path.join(__dirname, 'mikrotik.template');
//     const configPath = path.join(__dirname, 'config.json');
//
//     const template = fs.readFileSync(templatePath, 'utf-8');
//     const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
//
//     const result = substituteVariables(template, config);
//     console.log(result);
// };
//
// main().catch(console.error);
