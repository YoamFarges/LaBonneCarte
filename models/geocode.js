class Geocode {
    constructor(location, latitude, longitude) {
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        
        this.lngLat = new mapboxgl.LngLat(longitude, latitude);

    }
}