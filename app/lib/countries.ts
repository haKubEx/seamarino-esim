import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

export function getCountryName(code: string) {
  return countries.getName(code, "en") || code;
}

export function getFlagEmoji(code: string) {
  if (!code || code.length !== 2) {
    return "🌐";
  }

  return code
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}