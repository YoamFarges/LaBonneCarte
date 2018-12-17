class GeocodeAPI {
    constructor(geocodeCache, mapboxClient) {
        this.cache = geocodeCache;
        this.client = mapboxClient;
    }

    getGeocode(location) {
        log("GeocodeAPI will search for " + location);
        const cachedGeocode = this.cache.geocodeWithLocation(location);
        if (cachedGeocode) {
            log(`Geocode for '${location}' was already in cache : ${JSON.stringify(cachedGeocode)}`);
            return  new Promise(resolve => { resolve(cachedGeocode); });
        }

        const self = this;
        return new Promise(resolve => {
            this.retrieveGeocodeFromMapbox(location, function callback(geocode) {
                log(`Geocode for '${location}' was found by using mapbox' API : ${JSON.stringify(geocode)}`);
                self.cache.cacheGeocode(geocode);
                resolve(geocode);
            });
        });
    }

    retrieveGeocodeFromMapbox(location, callback) {
        this.client.geocoding.forwardGeocode({
            query: location,
            autocomplete: false,
            limit: 1,
            countries: ["fr"],
            language: ["fr"],
        })
        .send()
        .then(function (response) {
            if (response && response.body && response.body.features && response.body.features.length) {
                var feature = response.body.features[0];
                const center = feature.center;
                const geocode = new Geocode(location, center[1], center[0]);
                callback(geocode);
            } else {
                logError('Error while fetching geocode');
                log('... will retry in a few seconds');
                setTimeout(function () {
                    this.retrieveGeocodeFromMapbox(location, callback)
                }, 1200);
            }
        });
    }
}

