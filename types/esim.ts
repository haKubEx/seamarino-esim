export interface EsimPackage {
  packageCode: string;
  name: string;

  /**
   * Supplier wholesale price.
   *
   * eSIM Access normally returns an integer
   * where 1000 represents USD 1.00.
   */
  price: number;

  currencyCode: string;

  /**
   * One country code or multiple comma-separated
   * country codes.
   */
  location: string;

  locationCode?: string;

  speed: string;
  duration: number;
  durationUnit: string;
  volume: number;

  supportTopUpType: string;

  description?: string;
  descriptionList?: string[];
  saleNote?: string;

  /**
   * Storefront settings loaded from PlanSetting.
   */
  enabled?: boolean;
  featured?: boolean;
  favorite?: boolean;
  markupPercent?: number;
  displayName?: string;
  isLocalPlan?: boolean;

  /**
   * Calculated storefront price information.
   */
  supplierCostUsd?: number;
  markupAmountUsd?: number;
  sellingPriceUsd?: number;
  sellingPricePhp?: number;
  amountPhpCentavos?: number;

  /**
   * Normalized data-volume helpers.
   */
  volumeGb?: number;
  volumeMb?: number;
}