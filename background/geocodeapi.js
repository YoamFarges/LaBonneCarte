class GeocodeAPI {
    constructor(geocodeCache) {
        this.cache = geocodeCache;
    }

    getGeocode(cityName, postCode) {
        const location = this.makeLocation(cityName, postCode);

        log("GeocodeAPI will search for " + location);
        const cachedGeocode = this.cache.geocodeWithLocation(location);
        if (cachedGeocode) {
            log(`Geocode for '${location}' was already in cache : ${JSON.stringify(cachedGeocode)}`);
            return  new Promise(resolve => { resolve(cachedGeocode); });
        }

        return this.retrieveGeocodeFromDataGouv(cityName, postCode);
    }

    async retrieveGeocodeFromDataGouv(cityName, postCode) {
        const location = this.makeLocation(cityName, postCode);

        log(`Retrieve "${location}" from data gouv api...`);
        const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${cityName}&postcode=${postCode}&limit=1`);
        const json = await response.json();
        const feature = json.features[0];

        if (!feature) { throw new Error(`No feature was found for location "${location}"`)}

        const coordinates = feature.geometry.coordinates;
        const longitude = coordinates[0];
        const latitude = coordinates[1];
        
        return new Geocode(location, longitude, latitude);
    }

    makeLocation(cityName, postCode) {
        return `${cityName} ${postCode}`;
    }
}

