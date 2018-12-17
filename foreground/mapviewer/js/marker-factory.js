class MarkerFactory {
    constructor(backgroundInterface) {
        this.backgroundInterface = backgroundInterface;
    }

    makeMarker(item, callback) {
        this.backgroundInterface.getGeocode(item.location).then(geocode => {
            const marker = new Marker(item, geocode);
            callback(marker);
        });
    }
}

class Marker {
    constructor(item, geocode) {
        this.item = item;
        this.geocode = geocode;
        this.lngLat = {lng: geocode.longitude, lat: geocode.latitude};

        var element = document.createElement('div');
        element.className = 'marker';
        this.mapboxMarker = new mapboxgl.Marker(element).setLngLat(this.lngLat);
    }
}