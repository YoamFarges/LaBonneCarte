class MapManager {
    constructor(popupFactory) {
        this.popupFactory = popupFactory;
        this.markers = [];
        this.franceBounds = {center:[2.6025, 46.34], zoom:4}
    }

    loadMap() {
        mapboxgl.accessToken = mapboxAccessToken;
         this.map = new mapboxgl.Map({
            container: 'lbca_map',
            style: 'mapbox://styles/mapbox/streets-v10',
            center: this.franceBounds.center,
            zoom: this.franceBounds.zoom
        });
    
        var navigationControl = new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true,
        });
        this.map.addControl(navigationControl);
    
        log("MapManager did create map");
    }

    updateItems(geocodedItems) {
        this.removeExistingMarkers();
        this.placeItems(geocodedItems);
    }

    placeItems(geocodedItems) {
        var i;
        for (i = 0; i < geocodedItems.length; i++) {
            this.placeItem(geocodedItems[i]);
        }
        this.fitMapToMarkerBounds();
    }

    removeExistingMarkers() {
        this.markers.forEach(marker => {
            marker.mapboxMarker.remove();
        });
        this.markers = [];
    }

    placeItem(geocodedItem) {
        const marker = new Marker(geocodedItem, this.popupFactory);
        this.markers.push(marker);
        
        marker.mapboxMarker.addTo(this.map);

        const self = this;
        marker.div.addEventListener('click', () => {
            const markerCenter = marker.lngLat;
            const zoom = self.map.getZoom();

            const latitudeOffset = self.latitudeOffsetForPixels(90, markerCenter.lat, zoom);
            const lngLat = {lng: markerCenter.lng, lat: markerCenter.lat + latitudeOffset};

            self.map.easeTo({center:lngLat, zoom: zoom});
        });
    }

    fitMapToMarkerBounds() {
        if (this.markers.length == 0) {
            this.map.easeTo(this.franceBounds);
            return;
        }
        
        if (this.markers.length == 1) {
            const marker = this.markers[0];
            this.map.easeTo({center:marker.lngLat});
            return;
        }

        var bounds = new mapboxgl.LngLatBounds();
        this.markers.forEach(marker => {
            const lngLat = [marker.lngLat.lng, marker.lngLat.lat]; // only [lng, lat] format works for extending bounds...
            bounds.extend(lngLat);
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