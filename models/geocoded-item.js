class GeocodedItem {
    constructor(item, geocode) {
        this.item = item;
        this.geocode = geocode;
    }

    static geoJSONFeatureCollection(geocodedItems) {
        return {
            type: "FeatureCollection",
            features: geocodedItems.map(geocodedItem => {
                const item = geocodedItem.item;
                const geocode = geocodedItem.geocode;
                return {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [geocode.longitude, geocode.latitude]
                    },
                    properties: item
                };
            })
        };
    }
}