import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import Redis from 'ioredis';

export const getAtAGlance = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const redis: Redis = new Redis(parseInt(process.env.REDIS_CLUSTER_PORT!), process.env.REDIS_CLUSTER_HOST!);
    const glanceString: string | null = await redis.get('glance');
    const glanceHash: string | null = await redis.get('glancehash');
    const lastRun: string | null = await redis.get('lastRun');
    const lastUpdate: string | null = await redis.get('lastUpdate');

    let glance: any = glanceString ? JSON.parse(glanceString) : {assets: []};
    return {
        statusCode: 200,
        body: JSON.stringify({glance, hash: glanceHash, lastRun, lastUpdate})
    };
};

export const flushCache = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const redis: Redis = new Redis(parseInt(process.env.REDIS_CLUSTER_PORT!), process.env.REDIS_CLUSTER_HOST!);
    redis.flushall();

    return {
        statusCode: 200,
        body: JSON.stringify({message: 'Cache Flushed'})
    };

};
