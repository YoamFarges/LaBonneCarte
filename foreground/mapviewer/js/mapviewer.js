/*-------------------------*\
    ENTRY POINT
\*-------------------------*/

$(document).ready(function() {
    var map = createMap();
    receiveItemListFromBackgroundPage(function(itemList) {
        console.log(itemList.length + "items were retrieved from background thread");

        placeItemListMarkersOnMap(map, itemList);
    });
});

function createMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoieW9hbWZhcmdlcyIsImEiOiJjaml5aXIyMWkwYXpzM3FsZWQwODY5enF4In0.Xx-HaojIyreexKZds7vsuA';
    var map = new mapboxgl.Map({
        container: 'lbca_map',
        style: 'mapbox://styles/mapbox/streets-v10',
        center: [2.6025, 46.34],
        zoom: 4
    });

    var navigationControl = new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true,
    });
    map.addControl(navigationControl);

    return map;
}

function receiveItemListFromBackgroundPage(callback) {
    chrome.extension.sendMessage({method: MethodKeys.GET_ITEMS}, function(response){
        callback(response.items);
    });
}

/*-------------------------*\
    ITEMS TO MARKERS
\*-------------------------*/

function placeItemListMarkersOnMap(map, itemList) {
    return;
    
    var mapMarkers = [];
    var infowindow = new google.maps.InfoWindow(); //Just one reusable infowindow with modified content
    var oms = new OverlappingMarkerSpiderfier(map, {keepSpiderfied: true, legWeight:1});
    var boundsToFit = new google.maps.LatLngBounds();

    getInfowindowTemplate(function (template) {
        $.each(itemList, function iterateOverNextItem(index, item) {
            var mapMarker = new MapMarker(item);
            mapMarkers.push(mapMarker);

            mapMarker.loadGeocode(function() {
                var marker = mapMarker.createGoogleMarker(map);
                marker.desc = mapMarker.infowindowContent(template);
                boundsToFit.extend(marker.position);
                oms.addMarker(marker);
                if (index == itemList.length - 1) {
                    map.fitBounds(boundsToFit);
                }
            }); //load geocode
        }); //iterate
    }); //getInfoWindowTemplate

    handleEvents(map, oms, infowindow);
}

function handleEvents(map, oms, infowindow) {
    google.maps.event.addListener(map, "click", function(event) {
        infowindow.close();
    });

    oms.addListener('click', function(marker) {
        infowindow.close();
        infowindow.setContent(marker.desc);
        infowindow.open(map, marker);
    });

    oms.addListener('spiderfy', function(markers) {
        infowindow.close();
        $.each(markers, function(index, marker){
           marker.setIcon(MapMarker.selectedPinIcon());
           if (index == markers.length - 1) {
               google.maps.event.trigger(marker, 'click');
           }
        });
    });

    oms.addListener('unspiderfy', function(markers) {
        infowindow.close();
        $.each(markers, function(index, marker){
            marker.setIcon(MapMarker.defaultPinIcon());
        });
    });
}


/*-------------------------*\
    INFOWINDOW
\*-------------------------*/

function getInfowindowTemplate(callback) {
    var url = chrome.extension.getURL('foreground/mapviewer/html/infowindow.html');
    $.get(url, callback, 'html');
}
