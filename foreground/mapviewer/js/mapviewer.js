
$(document).ready(function() {
    log("Mapviewer initialization...");
    
    var backgroundInterface = new BackgroundInterface();
    var markerFactory = new MarkerFactory(backgroundInterface);

    var mapManager = new MapManager(markerFactory);
    mapManager.init(mapboxAccessToken);

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method == MethodKeys.DID_UPDATE_ITEMS) {
            const itemsDTO = request.innerDTO;
            const items = itemsDTO.items;
            log(`Mapviewer received message DID_UPDATE_ITEMS and will try to place ${items.length} items on the map.`);
            mapManager.updateItems(items);
        }
    });
});

class MapManager {
    constructor(markerFactory) {
        this.markerFactory = markerFactory;
        this.markers = [];
        this.map = null;
    }

    init(accessToken) {
        this.map = this.createMap(accessToken);
    }

    removeExistingMarkers() {
        this.markers.forEach(marker => {
            marker.mapboxMarker.remove();
        });
        this.markers = [];
    }

    placeItems(items) {
        items.forEach(item => {
            this.placeItem(item);
        });
    }

    placeItem(item) {
        var self = this;
        this.markerFactory.makeMarker(item, function callback(marker) {
            log(`Marker was created for item ${item.title} / ${item.location} at ${JSON.stringify(marker.lngLat)}`);
            self.markers.push(marker);
            marker.mapboxMarker.addTo(self.map);
        });
    }

    updateItems(items) {
        this.removeExistingMarkers();
        this.placeItems(items);
    }

    createMap(accessToken) {
        mapboxgl.accessToken = accessToken;
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
    
        log("MapManager did create map");

        return map;
    }
}

function placeItemListMarkersOnMap(map, items) {
    items.forEach(item => {
        
    });

    return;
    
    var mapMarkers = [];
    var infowindow = new google.maps.InfoWindow(); //Just one reusable infowindow with modified content
    var oms = new OverlappingMarkerSpiderfier(map, {keepSpiderfied: true, legWeight:1});
    var boundsToFit = new google.maps.LatLngBounds();

    getInfowindowTemplate(function (template) {
        $.each(itemList, function iterateOverNextItem(index, item) {
            var mapMarker = new OldMapMarker(item);
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
           marker.setIcon(OldMapMarker.selectedPinIcon());
           if (index == markers.length - 1) {
               google.maps.event.trigger(marker, 'click');
           }
        });
    });

    oms.addListener('unspiderfy', function(markers) {
        infowindow.close();
        $.each(markers, function(index, marker){
            marker.setIcon(OldMapMarker.defaultPinIcon());
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
