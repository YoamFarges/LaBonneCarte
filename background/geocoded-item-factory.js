class GeocodedItemFactory {
    constructor(geocodeAPI) {
        this.geocodeAPI = geocodeAPI;
    }

    async makeGeocodedItemFromItem(item) {
        const geocode = await this.geocodeAPI.getGeocode(item.city, item.postCode);
        return new GeocodedItem(item, geocode);
    }

    async makeGeocodedItemsFromItems(items) {
        const promises = items.map(item => this.makeGeocodedItemFromItem(item));
        const results = await Promise.all(promises.map(p => p.catch(err => { 
            console.log(err);
        } )));
        return results.filter(r => !!r);
    }
}