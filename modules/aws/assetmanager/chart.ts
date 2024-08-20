import {APIGatewayProxyResult} from 'aws-lambda';
import http from 'http';

interface EventBody {
    host: string;
    port: string;
    time_range: string;
}

interface QueryResult {
    results: any[];
}

export const getChartData = async (body: any): Promise<APIGatewayProxyResult> => {
    // const body: EventBody = JSON.parse(event.body);
    const { host, port, time_range: timeRange } = body;

    const influxdbUrl = 'http://172.27.251.10:8086/query';


    const queries = {
        inoctets: `SELECT non_negative_derivative(sum("inoctets"),1s)*8 FROM "traffic" WHERE "host"='${host}' and "interface"='${port}' AND time > now() - ${timeRange} GROUP BY time(10s) fill(null)`,
        outoctets: `SELECT non_negative_derivative(sum("outoctets"),1s)*8 FROM "traffic" WHERE "host"='${host}' and "interface"='${port}' AND time > now() - ${timeRange} GROUP BY time(10s) fill(null)`
    };

    const queryInfluxDB = (query: string): Promise<QueryResult> => {
        return new Promise((resolve, reject) => {
            const url = new URL(influxdbUrl);
            url.searchParams.append('db', 'links');
            url.searchParams.append('q', query);

            http.get(url.toString(), (res) => {
                let data = '';

                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`Failed with status code: ${res.statusCode}`));
                    }
                });
            }).on('error', err => reject(err));
        });
    };
    try {
        const [inoctets, outoctets] = await Promise.all([
            queryInfluxDB(queries.inoctets),
            queryInfluxDB(queries.outoctets)
        ]);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ inoctets, outoctets })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: (error as Error).message })
        };
    }
};
