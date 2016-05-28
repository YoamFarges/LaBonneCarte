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
    ITEMS TO MARKERS
\*-------------------------*/

function placeItemListMarkersOnMap(map, itemList) {
    var mapMarkers = [];
    var infowindow = new google.maps.InfoWindow(); //Just one reusable infowindow with modified content

    getInfowindowTemplate(function (template) {
        $.each(itemList, function iterateOverNextItem(index, item) {
            var mapMarker = new MapMarker(item);
            mapMarkers.push(mapMarker);
            
            mapMarker.loadGeocode(function() {   
                var marker = mapMarker.createGoogleMarker(map, infowindow);
                marker.addListener('click', function() {
                    infowindow.setContent(mapMarker.infowindowContent(template));
                    infowindow.open(map, marker);
                }); //Listener
            }); //load geocode
        }); //iterate
    }); //getInfoWindowTemplate
    
    google.maps.event.addListener(map, "click", function(event) {
        infowindow.close();
    });
}

/*-------------------------*\
    INFOWINDOW
\*-------------------------*/

function getInfowindowTemplate(callback) {
    var url = chrome.extension.getURL('mapviewer/html/infowindow.html');
    $.get(url, callback, 'html');
}
    