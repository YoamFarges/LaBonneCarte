class Geocode {
    constructor(location, lat, lng) {
        this.location = location;
        this.lat = lat;
        this.lng = lng;

        this.serialized = function() {return JSON.stringify(this);}
    }
}

Geocode.withJson = function(json) {
    var object = JSON.parse(json);
    return new Geocode(object.location, object.lat, object.lng);
}
