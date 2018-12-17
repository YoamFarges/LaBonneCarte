var MarkerBackgroundInterface = function() {
    this.searchGeocode = function(location, callback) {
        chrome.extension.sendMessage({method: 'searchGeocode', location:location}, callback);
    }

    this.saveGeocode = function(geocode, callback) {
        chrome.extension.sendMessage({method: 'insertGeocode', geocode: geocode.serialized()}, callback);
    }

    this.getJsonFromExternalUrl = function(url, callback) {
        chrome.extension.sendMessage({method: MethodKeys.GET_EXTERNAL_JSON, url:url}, callback);
    }
}

/*
    A wrapper class for Map marker, will handle all the functions to
    put a Leboncoin item on the google map.
*/
var OldMapMarker = function(item) {
    var that = this;

    this.item = item;
    this.geocode = null;
    this.googleMarker = null;
    this.backgroundInterface = new MarkerBackgroundInterface();

    this.createGoogleMarker = function(map) {
        if (!this.geocode) {throw new Error("CreateMarker requires an existing geocode");}

        var latlng = new google.maps.LatLng(this.geocode.lat, this.geocode.lng);
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            animation: google.maps.Animation.DROP,
            icon: OldMapMarker.defaultPinIcon(),
        });

        this.googleMarker = marker;
        return marker;
    }

    this.infowindowContent = function(template) {
        var content = template;
        content = content.replace('__TITLE__', item.title);
        content = content.replace('__CATEGORY__', item.category);
        content = content.replace('__DATE__', item.date);
        content = content.replace('__LOCATION__', item.location);
        content = content.replace('__PRICE__', item.price);
        content = content.replace('__LINKURL__', item.linkUrl);
        content = content.replace('__PICTUREURL__', item.pictureUrl);
        if (item.pictureUrl == null) {content.replace('__HIDDEN__', 'hidden');}
        else {content.replace('__HIDDEN__', '');}
        return content;
    }

    this.loadGeocode = function(callback) {
        this.backgroundInterface.searchGeocode(item.location, function (geocode) {
            if (geocode) {
                that.geocode = Geocode.withJson(geocode);
                callback();
            } else {
                that.getJSONGeocodeFromGoogleAPI(function (geocode) {
                    that.geocode = geocode;
                    that.backgroundInterface.saveGeocode(geocode, null);
                    callback();
                });
            }
        });
    }

    this.getJSONGeocodeFromGoogleAPI = function(callback) {
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + item.location;
        this.backgroundInterface.getJsonFromExternalUrl(url, function(data) {
            if (data.status != 'OK') {
                logError('Geocode overload or service down.');
                logError(data);

                //Retry in 5s
                log('... will retry in 5 seconds');
                setTimeout(function() {that.getJSONGeocodeFromGoogleAPI(callback)}, 1200);
                return;
            }
            var p = data.results[0].geometry.location;
            var geocode = new Geocode(item.location, p.lat, p.lng);
            callback(geocode);
        });
    }
}

/*-------------------------*\
    PIN COLOR
\*-------------------------*/

OldMapMarker.pinIcon = function(imageName) {
    return {
        url: chrome.extension.getURL('mapviewer/img/' + imageName),
        size: new google.maps.Size(24, 42),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(12, 42)
    };
}

OldMapMarker.defaultPinIcon = function() {return OldMapMarker.pinIcon("pinicon_default.png");}
OldMapMarker.selectedPinIcon = function() {return OldMapMarker.pinIcon("pinicon_selected.png");}
