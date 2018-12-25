class GeocodeCache {
    constructor(geocodesMap = new Map()) {
        this.geocodesMap = geocodesMap;
    }

    geocodeWithLocation(location) {
        let geocode = this.geocodesMap.get(location.toLowerCase());
        if (geocode === undefined) { return null; }
        return geocode;
    }

    cacheGeocode(geocode) {
        if (geocode == null) { return; }
        if (geocode.location == null) { return; }

        this.geocodesMap.set(geocode.location.toLowerCase(), geocode);
    }
}
