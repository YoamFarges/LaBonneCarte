
$(document).ready(function() {
    log("Mapviewer initialization... Will retrieve popup templates");

    getPopupTemplate(function callback(template) {
        log("Popup template was retrieved!")

        const backgroundInterface = new BackgroundInterface();
        const popupFactory = new PopupFactory(template);
        const markerFactory = new MarkerFactory(backgroundInterface, popupFactory);
        
        this.mapManager = new MapManager(markerFactory);
        this.mapManager.init(mapboxAccessToken);

        listenToBackground(this.mapManager);

        log("Mapviewer is fully initialized");
    });

    function listenToBackground(mapManager) {
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            if (request.method == MethodKeys.DID_UPDATE_ITEMS) {
                const itemsDTO = request.innerDTO;
                const items = itemsDTO.items;
                log(`Mapviewer received message DID_UPDATE_ITEMS and will try to place ${items.length} items on the map.`);
                mapManager.updateItems(items);
            }
        });
    }
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
        var counter = 0;
        const self = this;
        items.forEach(function (item, i) {
            self.placeItem(item, (_ => {
                if (i == items.length - 1) {
                    log("This is the last! Will make the map fit to the markers bounds.");
                    self.fitMapToMarkerBounds();
                }
            }));
        });
    }

    placeItem(item, callback) {
        var self = this;
        this.markerFactory.makeMarker(item, function (marker) {
            log(`Marker was created for item ${item.title} / ${item.location} at ${JSON.stringify(marker.lngLat)}`);
            self.markers.push(marker);
            const mapboxMarker = marker.mapboxMarker;

            marker.mapboxMarker.addTo(self.map);
            marker.div.addEventListener('click', () => {
                const markerCenter = marker.lngLat;
                const zoom = self.map.getZoom();

                const latitudeOffset = self.latitudeOffsetForPixels(90, markerCenter.lat, zoom);
                const lngLat = {lng: markerCenter.lng, lat: markerCenter.lat + latitudeOffset};

                self.map.easeTo({center:lngLat, zoom: zoom});
            });
            callback();
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

    fitMapToMarkerBounds() {
        var bounds = new mapboxgl.LngLatBounds();

        this.markers.forEach(marker => {
            bounds.extend(marker.lngLat);
        });

        this.map.fitBounds(bounds, {padding: 50});
    }

    latitudeOffsetForPixels(pixels, currentLatitude, zoomLevel) {
        const metersPerPixel = this.metersPerPixel(currentLatitude, zoomLevel);
        return (pixels * metersPerPixel) / 111111;
    }

    metersPerPixel(latitude, zoomLevel) {
        var earthCircumference = 40075017;
        var latitudeRadians = latitude * (Math.PI / 180);
        return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoomLevel + 8);
    };
}

// function handleEvents(map, oms, infowindow) {
//     google.maps.event.addListener(map, "click", function(event) {
//         infowindow.close();
//     });

//     oms.addListener('click', function(marker) {
//         infowindow.close();
//         infowindow.setContent(marker.desc);
//         infowindow.open(map, marker);
//     });

//     oms.addListener('spiderfy', function(markers) {
//         infowindow.close();
//         $.each(markers, function(index, marker){
//            marker.setIcon(OldMapMarker.selectedPinIcon());
//            if (index == markers.length - 1) {
//                google.maps.event.trigger(marker, 'click');
//            }
//         });
//     });

//     oms.addListener('unspiderfy', function(markers) {
//         infowindow.close();
//         $.each(markers, function(index, marker){
//             marker.setIcon(OldMapMarker.defaultPinIcon());
//         });
//     });
// }

function getPopupTemplate(callback) {
    var url = chrome.extension.getURL('foreground/mapviewer/html/popup.html');
    $.get(url, callback, 'html');
}