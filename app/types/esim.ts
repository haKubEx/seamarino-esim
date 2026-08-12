export interface EsimPackage {
  packageCode: string;
  name: string;

  /**
   * Supplier wholesale price.
   *
   * eSIM Access normally returns an integer
   * where the API-specific divisor is handled
   * by the pricing service.
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
   * Supplier package metadata.
   *
   * dataType:
   * 1 = fixed-volume/fixed-duration plan
   * 2 = daily-data plan
   */
  dataType?: number;
  durationType?: number;
  unusedValidTime?: number;
  fupPolicy?: string;
  slug?: string;
  retailPrice?: number;
  activeType?: number;

  /**
   * Storefront settings.
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