/*-------------------------*\
    ENTRY POINT
\*-------------------------*/


$(document).ready(function() {
    var map = createMap();    
    receiveItemListFromBackgroundPage(function(itemList) {    
        placeItemListMarkersOnMap(map, itemList);
    });
});

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
    var url = chrome.extension.getURL('mapviewer/html/infowindow.html');
    $.get(url, callback, 'html');
}
    