export interface EsimPlan {
  id: string;
  country: string;
  region: string;
  flag: string;
  operator: string;

  data: string;
  validity: string;
  price: number;
  currency: string;

  network: string;
  coverage: string[];

  description: string;

  available: boolean;
}

export interface CartItem {
  plan: EsimPlan;
  quantity: number;
}

export interface Customer {
  id: string;

  firstName: string;
  lastName: string;

  email: string;

  country: string;
}
export interface EsimPackage {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  smsStatus: number;
  dataType: number;
  unusedValidTime: number;
  duration: number;
  durationUnit: string;
  durationType: number;
  location: string;
  locationCode: string;
  description: string;
  descriptionList: string[];
  saleNote: string;
  activeType: number;
  favorite: boolean;
  retailPrice: number;
  speed: string;
  ipExport: string;
  supportTopUpType: number;
}