class MapManager {
    constructor(popupFactory) {
        this.popupFactory = popupFactory;
        this.markers = [];

        this.franceBounds = { center: [2.6025, 46.34], zoom: 4 }
        this.zoomSpiderifyTreshold = 8;
        this.iconImgURL = chrome.extension.getURL('foreground/map/img/pinicon.png');
    }

    loadMap() {
        mapboxgl.accessToken = mapboxAccessToken;
        this.map = new mapboxgl.Map({
            container: 'lbca_map',
            style: 'mapbox://styles/mapbox/streets-v9',
            center: this.franceBounds.center,
            zoom: this.franceBounds.zoom
        });

        var navigationControl = new mapboxgl.NavigationControl({
            showCompass: false,
            showZoom: true,
        });
        this.map.addControl(navigationControl);

        const self = this;
        return new Promise(resolve => {
            self.map.on('load', function () {
                self.map.loadImage(self.iconImgURL, function (error, image) {
                    if (error) { throw error; }
                    self.map.addImage('custom-icon-image', image);

                    self.initializeSpiderifier();
                    self.initializeMapLayers();
                    self.initializeMapActions();
                    log("MapManager did finish map creation");
                    resolve();
                });
            });
        });
    }

    updateItems(geocodedItems) {
        const geojsonData = GeocodedItem.geoJSONFeatureCollection(geocodedItems);
        this.map.getSource("pins").setData(geojsonData);
        this.fitMapToMarkerBounds();
    }

    fitMapToMarkerBounds() {
        if (this.markers.length == 0) {
            this.map.easeTo(this.franceBounds);
            return;
        }

        if (this.markers.length == 1) {
            const marker = this.markers[0];
            this.map.easeTo({ center: marker.lngLat });
            return;
        }

        var bounds = new mapboxgl.LngLatBounds();
        this.markers.forEach(marker => {
            const lngLat = [marker.lngLat.lng, marker.lngLat.lat]; // only [lng, lat] format works for extending bounds...
            bounds.extend(lngLat);
        });
        this.map.fitBounds(bounds, { padding: 50 });
    }

    initializeMapLayers() {
        const map = this.map;

        map.addSource("pins", {
            type: "geojson",
            data: GeocodedItem.geoJSONFeatureCollection([]),
            cluster: true,
            clusterMaxZoom: 100,
        });

        map.addLayer({
            id: 'pins',
            type: 'symbol',
            source: 'pins',
            layout: { "icon-image": "custom-icon-image" },
            filter: ['all', ['!has', 'point_count']]
        });

        map.addLayer({
            id: 'cluster-pins',
            type: 'circle',
            source: 'pins',
            filter: ['all', ['has', 'point_count']],
            paint: {
                'circle-color': '#f56b2b',
                'circle-radius': 14
            }
        });

        map.addLayer({
            id: 'cluster-pins-count',
            type: 'symbol',
            source: 'pins',
            layout: {
                'text-field': '{point_count}',
                'text-size': 12
            },
            paint: {
                'text-color': '#ffffff'
            }
        });
    }

    initializeSpiderifier() {
        const map = this.map;
        this.spiderifier = new MapboxglSpiderifier(map, {
            circleSpiralSwitchover: 9,
            customPin: true,
            initializeLeg: function (spiderLeg) {
                var $spiderPinCustom = $('<div>', { class: 'spider-point-circle' });

                $(spiderLeg.elements.pin).append($spiderPinCustom);
                $spiderPinCustom.css({
                    'width': '10px',
                    'height': '10px',
                    'margin-left': '-5px',
                    'margin-top': '-5px',
                    'background-color': '#ff0000',
                    'opacity': 0.8
                });

                var popup = new mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: false,
                    offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
                });

                popup.setHTML('WHAAAT');
                spiderLeg.mapboxMarker.setPopup(popup);

                $(spiderLeg.elements.container)
                    .on('mouseenter', function () {
                        popup.addTo(map);
                    })
                    .on('mouseleave', function () {
                        popup.remove();
                    });
            }
        })
    }

    initializeMapActions() {
        const self = this;
        const map = this.map;
        const spiderifier = this.spiderifier;

        map.on('zoomstart', function () {
            spiderifier.unspiderfy();
        });

        map.on('click', function() {
            spiderifier.unspiderfy();
        });

        map.on('mouseenter', 'pins', function(e) {
            map.getCanvas().style.cursor = 'pointer'
        });

        map.on('mouseleave', 'pins', function() {
            map.getCanvas().style.cursor = '';
        });

        map.on('click', 'pins', function(e) {
            const feature = e.features[0];
            if (!feature) { return; }

            const featureCenter = feature.geometry.coordinates;
            const featureLngLat = {lng: featureCenter[0], lat: featureCenter[1]};
            const zoom = self.map.getZoom();
            const latitudeOffset = latitudeOffsetForPixels(85, featureLngLat.lat, zoom);
            const lngLat = { lng: featureLngLat.lng, lat: featureLngLat.lat + latitudeOffset };
            self.map.easeTo({ center: lngLat, zoom: zoom });

            const item = feature.properties;
            const popupHTML = self.popupFactory.htmlForItem(item);
            const popup = PopupFactory.makePopup();
            popup.setLngLat(featureCenter)
                .setHTML(popupHTML)
                .addTo(map);

            return;
        });

        map.on('mouseenter', 'cluster-pins', function(e) {
            map.getCanvas().style.cursor = 'pointer'
        });

        map.on('mouseleave', 'cluster-pins', function() {
            map.getCanvas().style.cursor = '';
        });

        map.on('click', 'cluster-pins', function(e) {
            const feature = e.features[0];
            if (!feature) { return; }

            const featureCenter = feature.geometry.coordinates;
            const zoom = map.getZoom();
            if (zoom < self.zoomSpiderifyTreshold) {
                map.easeTo({ center: featureCenter, zoom: zoom + 2 });
                return;
            }

            map.easeTo({ center: featureCenter });
            map.getSource('pins').getClusterLeaves(feature.properties.cluster_id, 100, 0,
                function (err, leafFeatures) {
                    if (err) {
                        return console.error('error while getting leaves of a cluster', err);
                    }
                    var items = leafFeatures.map(x => x.properties);
                    spiderifier.spiderfy(featureCenter, items);
                }
            );
        });
    }
}