class GeocodeAPI {
    constructor(geocodeCache, communes) {
        this.cache = geocodeCache;
        this.communes = communes;
    }

    getGeocode(cityName, postCode) {
        const location = this.makeLocation(cityName, postCode);
        log(`Will get Geocode for '${location}'`);

        const cachedGeocode = this.cache.geocodeWithLocation(location);
        if (cachedGeocode) {
            log(`Geocode for '${location}' was already in cache : ${JSON.stringify(cachedGeocode)}`);
            return cachedGeocode;
        }

        const geocode = this.retrieveGeocodeFromGlobalCommunes(cityName, postCode);
        log("Geocode for location " + location + " is  " + JSON.stringify(geocode));
        
        return geocode;
    }

    retrieveGeocodeFromGlobalCommunes(cityName, postCode) {
        const location = this.makeLocation(cityName, postCode);

        const communesFilteredByPostCode = Commune.findAllByCodePostal(postCode, this.communes);
        if (communesFilteredByPostCode.length == 0) {
            throw new Error(`No commune was found for location "${location}".`);
        }

        if (communesFilteredByPostCode.length == 1) {
            return this.geocodeFromCommune(location, communesFilteredByPostCode[0]);
        } 

        const sanitizedCityName = this.sanitizeCityNameForCommuneComparison(cityName);
        log(sanitizedCityName);
        let commune = Commune.findFirstByCityName(sanitizedCityName, communesFilteredByPostCode);
        if (commune) { return this.geocodeFromCommune(location, commune); }

        commune = Commune.findFirstByLibelleAcheminement(sanitizedCityName, communesFilteredByPostCode);
        if (commune) { return this.geocodeFromCommune(location, commune); }

        throw new Error(`No commune was found for location "${location}".`);
    }

    sanitizeCityNameForCommuneComparison(name) {
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

    geocodeFromCommune(location, commune) {
        const coordinates = commune.coordonneesGPS.split(",");
        const latitude = coordinates[0];
        const longitude = coordinates[1];

        const geocode = new Geocode(location, latitude, longitude);
        this.cache.cacheGeocode(geocode);

        log(`Geocode found for '${location}': ${JSON.stringify(geocode)}`);
        return geocode;
    }

    makeLocation(cityName, postCode) {
        return `${cityName} ${postCode}`;
    }
}

