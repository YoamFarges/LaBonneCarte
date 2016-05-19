/*-------------------------*\
    ENTRY POINT
\*-------------------------*/

function googleMapsApiLoadedCallback() {
    var map = createMap();
    receiveItemListFromBackgroundPage(function(itemList) {    
        placeItemListMarkersOnMap(map, itemList);
    });
}

function createMap() {
    var mapDiv = document.getElementById('lbca_gmap');
    var gmap = new google.maps.Map(mapDiv, {
        center: {lat: 46.8052899, lng: 2.379206},
        zoom: 5
    });
    return gmap;
}

function receiveItemListFromBackgroundPage(callback) {
    chrome.extension.sendMessage({method: 'getItemList'}, function(response){
        callback(response.itemList);
    });
}

/*-------------------------*\
    MARKERS
\*-------------------------*/

function placeItemListMarkersOnMap(map, itemList) {
    var infowindow = new google.maps.InfoWindow(); //Just one reusable infowindow with modified content
    
    getInfowindowTemplate(function(template) {
        $.each(itemList, function(index, item) {
            var iwContent = fillInfowindowTemplateWithItem(template, item);
            addMarkerToMap(map, item.location, function(marker) {
                marker.addListener('click', function() {
                    infowindow.setContent(iwContent);
                    infowindow.open(map, marker);
                });
            });
        });
    });    
}

function addMarkerToMap(map, location, callback) {
    chrome.extension.sendMessage({method: 'searchGeocode', location:location}, searchGeocodeCallback);
    
    function searchGeocodeCallback(geocode) {     
        if (geocode == null || geocode === undefined) {
            getJSONFromGoogleAPI();
        } else {
            createMarker(geocode.lat, geocode.lon);
        }
    }
    
    function getJSONFromGoogleAPI() {

        chrome.extension.sendMessage({method: 'getJSON', url:url}, getJSONFromGoogleAPICallback);   
    }
    
    function getJSONFromGoogleAPICallback(data) {
        if (data.status != 'OK') {
            console.log('Geocode overload or service down.');
            console.log(data);
            return;
        }
        
        var p = data.results[0].geometry.location;
        insertGeocode(location, p.lat, p.lon);
        createMarker(p.lat, p.lon);
    }

    function insertGeocode(location, lat, lon) {
        chrome.extension.sendMessage({method: 'insertGeocode', location:location, lat:lat, lon:lon});
    }
    
    function createMarker(lat, lon) {
        var latlng = new google.maps.LatLng(lat, lng);
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            animation: google.maps.Animation.DROP,
        });
        callback(marker);
    }
}


/*-------------------------*\
    INFOWINDOW
\*-------------------------*/

function getInfowindowTemplate(callback) {
    var url = chrome.extension.getURL('mapviewer/html/infowindow.html');
    $.get(url, callback, 'html');
}

function fillInfowindowTemplateWithItem(template, item) {
    var content = template;
    content = content.replace('__TITLE__', item.title);
    content = content.replace('__CATEGORY__', item.category);
    content = content.replace('__DATE__', item.date);
    content = content.replace('__LOCATION__', item.location);
    content = content.replace('__PRICE__', item.price);
    content = content.replace('__LINKURL__', item.linkUrl);
    content = content.replace('__PICTUREURL__', item.pictureUrl);
    return content;
}

    