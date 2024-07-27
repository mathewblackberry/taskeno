// src/app/models/models.ts
import { IPv4, IPv4CidrRange } from 'ip-num';

export class Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  primaryContact: string;
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
  active: boolean;
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
  defaultGateway?: boolean;
  network?: boolean;
  broadcast?: boolean;
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


export type AssetDataElement = {
  label: string,
  value: string | undefined,
  field: string,
  required?: boolean,
  min?: number,
  max?: number,
  regexp?: string | RegExp
}
