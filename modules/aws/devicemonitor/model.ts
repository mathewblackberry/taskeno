import {IPv4, IPv4CidrRange} from 'ip-num';

export class Tenant {
    id: string;
    name: string;
    email: string;
    phone: string;
    primaryContact: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postcode: string;
}

export class Site {
    id: string;
    name: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    postcode: string;
    phone: string;
    email: string;
    latitude: string;
    longitude: string;
    active:  boolean;
}

export class Asset {
    id: string;
    hostname: string;
    terminals: number;
    lanSubnets: SubnetDetails[];
    wanSubnets: IPv4CidrRange[];
    loopbacks: IPv4CidrRange[];
    carriageType: string;
    carriageFNN: string;
    carriagePort: string;
    FNN: string;
    POI: string;
    routerDetails?: RouterDetails;
    active: boolean;
}

export class SubnetDetails {
    subnet: IPv4CidrRange;
    hosts: Host[];
}

export class Host {
    ip: IPv4;
    name: string;
    active: boolean;
}

export class RouterDetails {
    defaultCredentials: Credential;
    credentials: Credential[];
    serialNumber: string;
    model: string;
    manufacturer: string;
    mobileDetails?: MobileDetails;
}

export class Credential {
    username: string;
    password?: string;
    purpose?: string
}

export class MobileDetails {
    username?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    framedIP?: IPv4;
    framedRoutes?: IPv4CidrRange[];
    simSerial: string;
    mobileNumber: string;
    PUK: string;
}


export class Comment {
    user: string;
    id: string | null;
    comment: string;
    edited: boolean = false;
}

    export class InvoiceEvent {
        eventType: 'ACTIVATED' | 'DEACTIVATED';
        timestamp: string;
        rate: Rate;
        id: string;
        tenantId: string;
    }

    export class Rate {
        id: string;
        name: string;
        upfront: number;
        ongoing: number;
        tenantId: string;
    }


export class Glance {
    assets: GlanceAsset[];
}

export class GlanceAsset {
    name: string;
    hostname: string;
    status: number;
    interfaces: GlanceInterfaces[];
}

export class GlanceInterfaces {
    name: string;
    running: boolean;
}
