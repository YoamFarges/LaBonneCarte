import type {Item} from "~shared/parser/item";
import {AllCommunes, type Commune} from "./commune";

export interface GeocodingResult {
    commune?: Commune;
    // Human-readable explanation of how the commune was chosen, or why none was found.
    reason: string;
    candidates: Commune[];
}

export class Geocoder {
    static communeOfItem(item: Item): Commune | undefined {
        return Geocoder.geocode(item).commune;
    }

    static geocode(item: Item): GeocodingResult {
        if (!item.postCode) {
            return { reason: "no postcode", candidates: [] };
        }

        const communes = AllCommunes.fromPostCode(item.postCode);
        if (communes.length == 0) {
            return { reason: `postcode ${item.postCode} not in database`, candidates: communes };
        }

        if (communes.length == 1) {
            return { commune: communes[0], reason: "only commune for postcode", candidates: communes };
        }

        const sanitizedCityName = sanitizeCityNameForCommuneComparison(item.city);
        let searchResult = communes.find((commune) => commune.n == sanitizedCityName);
        if (searchResult) {
            return { commune: searchResult, reason: `name match "${sanitizedCityName}"`, candidates: communes };
        }

        searchResult = communes.find((commune) => commune.l == sanitizedCityName);
        if (searchResult) {
            return { commune: searchResult, reason: `libellé match "${sanitizedCityName}"`, candidates: communes };
        }

        return {
            reason: `"${item.city}" → "${sanitizedCityName}" matches none of ${communes.length} communes for ${item.postCode}`,
            candidates: communes
        };
    }
}

function sanitizeCityNameForCommuneComparison(name:string) : string {
    let sanitized = name
        .toUpperCase()
        .normalize("NFD").replaceAll(/\p{Diacritic}/gu, "") //https://stackoverflow.com/a/37511463/913664
        .replaceAll("-", " ")
        .replaceAll("'", "");
    if (sanitized.startsWith("SAINT ")) {
        sanitized = sanitized.replace("SAINT", "ST");
    }
    if (sanitized.startsWith("SAINTE ")) {
        sanitized = sanitized.replace("SAINTE", "STE");
    }
    return sanitized;
}
