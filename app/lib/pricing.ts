const ESIM_ACCESS_PRICE_DIVISOR = 10_000;

const DEFAULT_USD_TO_PHP_RATE = 58;
const DEFAULT_MARKUP_PERCENT = 20;

export type PricingInput = {
  supplierPrice: number;
  volume: number;
  usdToPhpRate?: number;
  markupPercent?: number;
};

export type PlanPriceBreakdown = {
  supplierCostUsd: number;

  volumeGb: number;
  volumeMb: number;

  flatMarkupUsd: number;
  percentageMarkupUsd: number;
  markupAmountUsd: number;

  sellingPriceUsd: number;
  sellingPricePhp: number;
  amountPhpCentavos: number;
};

function normalizeFiniteNumber(
  value: unknown,
  fallback: number,
): number {
  const numericValue =
    Number(value);

  return Number.isFinite(
    numericValue,
  )
    ? numericValue
    : fallback;
}

function roundCurrency(
  value: number,
): number {
  return Math.round(
    (value + Number.EPSILON) *
      100,
  ) / 100;
}

function getVolumeInGb(
  volume: number,
): number {
  if (
    !Number.isFinite(volume) ||
    volume <= 0
  ) {
    return 0;
  }

  return (
    volume /
    1024 /
    1024 /
    1024
  );
}

function getVolumeInMb(
  volume: number,
): number {
  if (
    !Number.isFinite(volume) ||
    volume <= 0
  ) {
    return 0;
  }

  return (
    volume /
    1024 /
    1024
  );
}

/**
 * Minimum fixed markup based on data volume.
 *
 * The configured percentage markup is also
 * calculated. The greater of the two is used.
 */
function getFlatMarkupUsd(
  volumeGb: number,
): number {
  const roundedGb =
    Math.max(
      1,
      Math.round(volumeGb),
    );

  switch (roundedGb) {
    case 1:
      return 1;

    case 3:
    case 5:
      return 2;

    case 10:
    case 20:
      return 3;

    case 30:
      return 3.5;

    case 50:
      return 4;

    default:
      return 5;
  }
}

export function calculatePlanPrice({
  supplierPrice,
  volume,
  usdToPhpRate =
    DEFAULT_USD_TO_PHP_RATE,
  markupPercent =
    DEFAULT_MARKUP_PERCENT,
}: PricingInput): PlanPriceBreakdown {
  const normalizedSupplierPrice =
    Math.max(
      0,
      normalizeFiniteNumber(
        supplierPrice,
        0,
      ),
    );

  const normalizedVolume =
    Math.max(
      0,
      normalizeFiniteNumber(
        volume,
        0,
      ),
    );

  const normalizedUsdToPhpRate =
    Math.max(
      0,
      normalizeFiniteNumber(
        usdToPhpRate,
        DEFAULT_USD_TO_PHP_RATE,
      ),
    );

  const normalizedMarkupPercent =
    Math.max(
      0,
      normalizeFiniteNumber(
        markupPercent,
        DEFAULT_MARKUP_PERCENT,
      ),
    );

  /*
   * eSIM Access supplier prices use:
   *
   * 10,000 = USD 1.00
   *
   * Example:
   * 53,000 = USD 5.30
   */
  const supplierCostUsd =
    normalizedSupplierPrice /
    ESIM_ACCESS_PRICE_DIVISOR;

  const volumeGb =
    getVolumeInGb(
      normalizedVolume,
    );

  const volumeMb =
    getVolumeInMb(
      normalizedVolume,
    );

  const flatMarkupUsd =
    getFlatMarkupUsd(
      volumeGb,
    );

  const percentageMarkupUsd =
    supplierCostUsd *
    (
      normalizedMarkupPercent /
      100
    );

  /*
   * Use whichever markup is higher:
   *
   * - configured percentage markup
   * - minimum volume-based markup
   */
  const markupAmountUsd =
    Math.max(
      flatMarkupUsd,
      percentageMarkupUsd,
    );

  const sellingPriceUsd =
    roundCurrency(
      supplierCostUsd +
        markupAmountUsd,
    );

  const sellingPricePhp =
    roundCurrency(
      sellingPriceUsd *
        normalizedUsdToPhpRate,
    );

  const amountPhpCentavos =
    Math.round(
      sellingPricePhp *
        100,
    );

  return {
    supplierCostUsd:
      roundCurrency(
        supplierCostUsd,
      ),

    volumeGb:
      Number(
        volumeGb.toFixed(3),
      ),

    volumeMb:
      Number(
        volumeMb.toFixed(2),
      ),

    flatMarkupUsd:
      roundCurrency(
        flatMarkupUsd,
      ),

    percentageMarkupUsd:
      roundCurrency(
        percentageMarkupUsd,
      ),

    markupAmountUsd:
      roundCurrency(
        markupAmountUsd,
      ),

    sellingPriceUsd,
    sellingPricePhp,
    amountPhpCentavos,
  };
}

/**
 * Backwards-compatible USD price helper used by
 * the plan details and checkout pages.
 */
export function getSellingPrice(
  cost: number,
  volume: number,
  markupPercent =
    DEFAULT_MARKUP_PERCENT,
): string {
  const pricing =
    calculatePlanPrice({
      supplierPrice:
        cost,

      volume,

      markupPercent,
    });

  return pricing
    .sellingPriceUsd
    .toFixed(2);
}