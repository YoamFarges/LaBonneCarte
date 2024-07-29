import type {Item} from "~shared/models/item";
import {AllCommunes, type Commune} from "./commune";

export class Geocoder {
    static communeOfItem(item: Item): Commune | undefined {
        const communes = AllCommunes.fromPostCode(item.postCode);
        if (communes.length == 0) {
            return undefined
        }

        if (communes.length == 1) {
            return communes[0]
        }

        const sanitizedCityName = sanitizeCityNameForCommuneComparison(item.city);
        let searchResult = communes.find((commune) => commune.nom == sanitizedCityName);
        if (searchResult) {
            return searchResult;
        }

        searchResult = communes.find((commune) => commune.libelleAcheminement == sanitizedCityName);
        return searchResult;
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
