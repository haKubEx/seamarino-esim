export interface EsimPackageDescription {
  title?: string;
  content?: string;
}

export interface EsimPackage {
  packageCode: string;
  name: string;

  /**
   * Supplier price.
   *
   * eSIM Access normally returns this as an integer
   * where 1000 represents USD 1.00.
   */
  price: number;

  currencyCode: string;

  /**
   * May contain one country code or multiple
   * comma-separated country codes.
   */
  location: string;

  locationCode?: string;

  speed: string;

  duration: number;
  durationUnit: string;

  volume: number;

  /**
   * Supplier values may arrive as:
   *
   * "0"
   * "1"
   * "true"
   * "false"
   *
   * Keep this as a string and normalize it in the UI
   * before deciding whether top-up is supported.
   */
  supportTopUpType: string;

  description?: string;

  /**
   * Optional list of description points shown on
   * the individual package page.
   */
  descriptionList?: string[];

  saleNote?: string;

  /**
   * Storefront settings loaded from PlanSetting.
   */
  featured?: boolean;

  /**
   * Optional favorite or highlighted plan flag.
   */
  favorite?: boolean;

  markupPercent?: number;
}