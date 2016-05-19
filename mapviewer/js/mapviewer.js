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
    getInfowindowTemplate(getInfowindowTemplateCallback);
        
    function getInfowindowTemplateCallback(template) {
        $.each(itemList, iterateOverNextItem);
        
        function iterateOverNextItem(index, item) {
             var iwContent = fillInfowindowTemplateWithItem(template, item);
             addMarkerToMap(map, item.location, addMarkerToMapCallback);
             
            function addMarkerToMapCallback(marker) {
                console.log('addMarkerToMapCallback');
                marker.addListener('click', function() {
                    infowindow.setContent(iwContent);
                    infowindow.open(map, marker);
                });
            }
             
        }
    }
}

function addMarkerToMap(map, location, callback) {
    chrome.extension.sendMessage({method: 'searchGeocode', location:location}, searchGeocodeCallback);
    
    function searchGeocodeCallback(geocode) {        
        if (geocode == null) {
            getJSONFromGoogleAPI();
        } else {
            var object = JSON.parse(geocode);
            console.log(geocode);
            createMarker(object.lat, object.lng);
        }
    }
    
    function getJSONFromGoogleAPI() {
        var url = 'http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=' + location;
        chrome.extension.sendMessage({method: 'getJSON', url:url}, getJSONFromGoogleAPICallback);   
    }
    
    function getJSONFromGoogleAPICallback(data) {
        console.log('getJSONFromGoogleAPICallback');
        if (data.status != 'OK') {
            console.log('Geocode overload or service down.');
            console.log(data);
            
            //Retry in 5s
            console.log('... will retry in 5 seconds');
            setTimeout(getJSONFromGoogleAPI, 5000)
            
            return;
        }
        
        var p = data.results[0].geometry.location;
        insertGeocode(location, p.lat, p.lng);
        createMarker(p.lat, p.lng);
    }

    function insertGeocode(location, lat, lng) {
        chrome.extension.sendMessage({method: 'insertGeocode', location:location, lat:lat, lng:lng});
    }
    
    function createMarker(lat, lng) {        
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

    