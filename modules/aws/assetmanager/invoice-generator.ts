import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {DynamoDBDocumentClient, GetCommand, QueryCommand} from '@aws-sdk/lib-dynamodb';
import {APIGatewayProxyResult} from 'aws-lambda';
import * as js2xmlparser from "js2xmlparser";
import {Asset, Site, Tenant} from './model';

const ddbClient = new DynamoDBClient({region: process.env.AWS_REGION});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const queueUrl = process.env.INVOICE_SQS

export class Rate {
    id: string;
    description: string;
    upfront: number;
    ongoing: number;

    constructor(id: string, description: string, upfront: number, ongoing: number) {
        this.id = id;
        this.description = description;
        this.upfront = upfront;
        this.ongoing = ongoing;
    }
}

interface SiteDetails {
    pk: string;
    sk: string;
    name: string;
    id: string;
    tenantId: string;
    data: Site;
}

interface AssetDetails {
    pk: string;
    sk: string;
    name: string;
    id: string;
    tenantId: string;
    data: Asset;
}

interface EventDetails {
    pk?: string;
    sk?: string;
    eventType: 'ACTIVATED' | 'DEACTIVATED';
    timestamp: string;
    until?: string;
    rate?: Rate | null;
    billingAmount?: string;
}

interface Invoice {
    tenant: Tenant,
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    data: InvoiceData
    totalExGst: number
    totalIncGst: number
    overdueIncGst: number
    gst: number
    totalDue: number
    periodStartDate: string
    periodEndDate: string
}

interface InvoiceData {

    site: Site;
    assets: {
        asset: Asset;
        events: EventDetails[];
        billingAmount: string;
    }[];
}

const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Tasmania',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
});

export const generateInvoicesForTenant = async (tenantId: string, startOfMonth: string, endOfMonth: string, TABLE_NAME: string, invoiceDate: string, invoiceNumber: string, overdueIncGST: number): Promise<APIGatewayProxyResult> => {

    const tenantParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `TENANT`
        }
    }

    const tenantResult = await docClient.send(new GetCommand(tenantParams));
    if (!tenantResult.Item)
        return {statusCode: 404, body: JSON.stringify({message: 'Invalid Customer'})};

    // Step 1: Retrieve All Sites for the Tenant
    const sitesParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :tenantId AND begins_with(sk, :sitePrefix)',
        ExpressionAttributeValues: {
            ':tenantId': `TENANT#${tenantId}`,
            ':sitePrefix': 'SITE#'
        }
    };

    const sitesResult = await docClient.send(new QueryCommand(sitesParams));
    const sites = sitesResult.Items as SiteDetails[];

    // Step 2: Loop through each site and generate invoices
    const invoices: InvoiceData[] = [];
    for (const site of sites) {
        const invoice = await generateInvoiceForSite(tenantId, site.id, startOfMonth, endOfMonth, TABLE_NAME);
        // Add the invoice only if there are assets that meet the activation criteria
        if (invoice.assets.length > 0) {
            invoices.push(invoice);
        }
    }

    const invoiceDateAsDate = new Date(invoiceDate);
    let dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 14);

    const totalExGst = 9999.6
    const gst = (Math.round(totalExGst * 0.1 * 100) / 100);
    const totalIncGst = (Math.round(totalExGst * 1.1 * 100) / 100);
    const overdueIncGst = (Math.round(overdueIncGST * 100) / 100);
    const totalDue = totalIncGst + overdueIncGst;

    const invoice = {
        tenant: tenantResult.Item.data,
        invoiceId: invoiceNumber,
        invoiceDate: formatter.format(invoiceDateAsDate),
        dueDate: formatter.format(dueDate),
        data: invoices,
        totalExGst: totalExGst.toFixed(2),
        gst: gst.toFixed(2),
        totalIncGst: totalIncGst.toFixed(2),
        overdueIncGst: overdueIncGst.toFixed(2),
        totalDue: totalDue.toFixed(2),
        periodStartDate: formatter.format(new Date(startOfMonth)),
        periodEndDate: formatter.format(new Date(endOfMonth))
    }

    const xml = convertJsonToXml(invoice);
    await sendXmlToSQS(xml);

    return {statusCode: 200, body: JSON.stringify({json: invoice, xml: xml})};
}

const generateInvoiceForSite = async (
    tenantId: string, siteId: string,
    startOfMonth: string, endOfMonth: string,
    TABLE_NAME: string): Promise<InvoiceData> => {

    // Step 1: Retrieve Site Details
    const siteDetailsParams = {
        TableName: TABLE_NAME,
        Key: {
            pk: `TENANT#${tenantId}`,
            sk: `SITE#${siteId}`
        }
    };
    const siteDetailsResult = await docClient.send(new GetCommand(siteDetailsParams));
    const siteDetails = siteDetailsResult.Item as SiteDetails;

    // Step 2: Retrieve All Assets for the Site
    const assetsParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :siteId',
        ExpressionAttributeValues: {
            ':siteId': `SITE#${siteId}`
        }
    };
    const assetsResult = await docClient.send(new QueryCommand(assetsParams));
    const assets = assetsResult.Items as AssetDetails[];

    // Step 3: Retrieve Events for Each Asset and Filter by Activation
    const assetsWithBilling = [];
    for (const asset of assets) {
        // Retrieve the latest event before the start of the month
        const latestEventBeforeParams = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :assetId AND sk < :start',
            ExpressionAttributeValues: {
                ':assetId': `ASSET#${asset.id}`,
                ':start': `EVENT#${startOfMonth}`
            },
            ScanIndexForward: false,
            Limit: 1
        };
        const latestEventBeforeResult = await docClient.send(new QueryCommand(latestEventBeforeParams));
        const latestEventBefore: EventDetails[] = latestEventBeforeResult.Items as EventDetails[];

        // Retrieve events within the current month
        const eventsParams = {
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :assetId AND sk BETWEEN :start AND :end',
            ExpressionAttributeValues: {
                ':assetId': `ASSET#${asset.id}`,
                ':start': `EVENT#${startOfMonth}`,
                ':end': `EVENT#${endOfMonth}`
            }
        };
        const eventsResult = await docClient.send(new QueryCommand(eventsParams));
        const events = eventsResult.Items as EventDetails[];

        // Combine the latest event before the month with the current month's events
        const allEvents = [...latestEventBefore, ...events];

        // Check if the asset was activated during the month or was still active at the start of the month
        const wasActivated = allEvents.some(event => event.eventType === 'ACTIVATED' && new Date(event.timestamp) >= new Date(startOfMonth));
        const wasActiveAtStart = latestEventBefore.length > 0 && latestEventBefore[0].eventType === 'ACTIVATED';

        if (wasActivated || wasActiveAtStart) {
            const billingAmount = calculateBilling(allEvents, new Date(startOfMonth), new Date(endOfMonth));
            assetsWithBilling.push({
                asset: asset.data,
                events: wasActiveAtStart ? formatEvents(allEvents) : formatEvents(events),
                billingAmount,
                wasActive: wasActiveAtStart
            });
        }
    }

    // Combine into Invoice Data
    return {
        site: siteDetails.data,
        assets: assetsWithBilling
    };
}

const formatEvent = (event: EventDetails): EventDetails => {

    // Format the date to 'dd MMM yyyy'
    const formattedDate = formatter.format(new Date(event.timestamp));

    return {
        eventType: event.eventType,
        timestamp: formattedDate,
        rate: event.rate,
        billingAmount: event.billingAmount,
        until: event.until
    };
};

const formatEvents = (events: EventDetails[]): EventDetails[] => {
    return events.map(formatEvent);
}

function calculateBilling(events: EventDetails[], startOfMonth: Date, endOfMonth: Date): string {
    let totalBilling = 0;
    let lastActivationTime: Date | null = null;
    let lastRate: Rate | null | undefined = null;
    let lastRateBeforePerid: boolean = false;

    for (let i = 0; i < events.length; i++){
        const event = events[i];
        const eventTime = new Date(event.timestamp);

        if (event.eventType === 'ACTIVATED') {
            lastActivationTime = eventTime;
            lastRate = event.rate;
            lastRateBeforePerid = eventTime < startOfMonth;

            if (eventTime >= startOfMonth && eventTime <= endOfMonth && lastRate) {
                totalBilling += lastRate.upfront;
            }
        } else if (event.eventType === 'DEACTIVATED' && lastActivationTime && lastRate) {
            const activeTime = Math.min(eventTime.getTime(), endOfMonth.getTime()) - Math.max(lastActivationTime.getTime(), startOfMonth.getTime());
            const proRataCharge = (activeTime / (endOfMonth.getTime() - startOfMonth.getTime())) * lastRate.ongoing;
            if (lastRate && ! lastRateBeforePerid) {
                event.billingAmount = (Math.round((proRataCharge + lastRate.upfront) * 100) / 100).toFixed(2);
            }else {
                event.billingAmount = (Math.round(proRataCharge  * 100) / 100).toFixed(2);
            }

            if(i> 0 && events[i-1].eventType === 'ACTIVATED'){
                events[i-1].billingAmount = event.billingAmount;
                events[i-1].until =  formatter.format(eventTime);
            }

            totalBilling += proRataCharge;

            // Reset activation time after deactivation
            lastActivationTime = null;
            lastRate = null;
        }
    }

    // If the last event is ACTIVATED and there's no corresponding DEACTIVATED event
    if (lastActivationTime && lastRate) {
        const activeTime = endOfMonth.getTime() - Math.max(lastActivationTime.getTime(), startOfMonth.getTime());
        const proRataCharge = (activeTime / (endOfMonth.getTime() - startOfMonth.getTime())) * lastRate.ongoing;
        if (!lastRateBeforePerid) {
            events[events.length-1].billingAmount = (Math.round((proRataCharge + lastRate.upfront) * 100) / 100).toFixed(2);
        }else {
            events[events.length-1].billingAmount = (Math.round(proRataCharge  * 100) / 100).toFixed(2);
        }
        events[events.length-1].until = formatter.format(endOfMonth);
        totalBilling += proRataCharge;
    }

    return (Math.round(totalBilling * 100) / 100).toFixed(2);

}

const convertJsonToXml = (json: any): string => {
    const clean = removeUndefinedFields(json);
    return js2xmlparser.parse("Invoice", clean);
};

function removeUndefinedFields(obj: any): any {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) => value !== undefined)
    );
}




// Function to send the XML to an SQS Queue
const sendXmlToSQS = async (xml: string): Promise<void> => {
    const params = {
        QueueUrl: queueUrl,
        MessageBody: xml,
        MessageGroupId: 'test4'
    };

    try {
        const sqsClient: SQSClient = new SQSClient({region: process.env.AWS_REGION});
        const data = await sqsClient.send(new SendMessageCommand(params));
        console.log('Message sent to SQS:', data.MessageId);
    } catch (err) {
        console.error('Error sending message to SQS:', err);
    }
};