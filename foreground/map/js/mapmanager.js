class MapManager {
    constructor(popupFactory) {
        this.popupFactory = popupFactory;
        this.markers = [];

        this.franceBounds = { center: [2.6025, 46.34], zoom: 4.5 }
        this.zoomSpiderifyTreshold = 8;
        this.iconImgURL = chrome.extension.getURL('foreground/map/img/pinicon.png');
        this.popup = null;
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
        this.removePopup();
        this.spiderifier.unspiderfy();

        const geojsonData = GeocodedItem.geoJSONFeatureCollection(geocodedItems);
        this.map.getSource("pins").setData(geojsonData);

        const self = this;
        setTimeout(function () { // So ugly but there is no "map.setData" callback yet
            self.fitMapBoundingBox();
        }, 200);

        log("Map manager did update geojson data");
    }

    fitMapBoundingBox() {
        const map = this.map;

        const features = map.querySourceFeatures('pins');
        this.map.easeTo(this.franceBounds);
        return;

        if (features.length == 0) { 
            this.map.easeTo(this.franceBounds);
            return;
        }

        if (features.length == 1) {
            const feature = features[0];
            const lngLat = feature.geometry.coordinates
            map.easeTo({ center: lngLat });
            return;
        }

        var bounds = new mapboxgl.LngLatBounds();
        features.forEach(feature => {
            const lngLat = feature.geometry.coordinates;
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
                'circle-color': [
                    "interpolate", ["linear"], ["zoom"],
                    // zoom is 8 (or less) -> color will be orange
                    this.zoomSpiderifyTreshold, '#f56b2b',
                    // in between, color will be interpolated
                    this.zoomSpiderifyTreshold + 0.05, '#e74c3c'
                    // zoom is 8.05 (or greater) -> color will be red
                ],
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
        const self = this;
        this.spiderifier = new MapboxglSpiderifier(map, {
            circleSpiralSwitchover: 9,
            customPin: false,
            onClick: function (e, marker) {
                const markerLngLat = marker.mapboxMarker.getLngLat();
                const item = marker.feature;
                const offset = MapboxglSpiderifier.popupOffsetForSpiderLeg(marker, 36);

                map.easeTo({ center: markerLngLat, offset: {x: -marker.param.x, y: -marker.param.y + 200, z: 0} });

                if (self.popup) { self.popup.remove(); }
                self.popup = self.makePopup(item, markerLngLat, offset, false);
                self.popup.addTo(map);
                
                self.popup.on('close', function(e) {
                    self.popup = null;
                })

                e.stopPropagation();
            }
        })
    }

    initializeMapActions() {
        const self = this;
        const map = this.map;
        const spiderifier = this.spiderifier;

        map.on('click', function() {
            self.removePopup();
            spiderifier.unspiderfy();
        });

        map.on('zoomstart', function () {
            self.removePopup();
            spiderifier.unspiderfy();
        });

        map.on('mouseenter', 'pins', function(e) {
            map.getCanvas().style.cursor = 'pointer'
        });

        map.on('mouseleave', 'pins', function() {
            map.getCanvas().style.cursor = '';
        });

        map.on('click', 'pins', function(e) {
            self.removePopup();
            spiderifier.unspiderfy();

            const feature = e.features[0];
            if (!feature) { return; }

            const featureCenter = feature.geometry.coordinates;
            const featureLngLat = {lng: featureCenter[0], lat: featureCenter[1]};
            const item = feature.properties;

            map.easeTo({ center: featureLngLat, offset: {x: 0, y: 180, z: 0} });
            this.popup = self.makePopup(item, featureLngLat, 20, true);
            this.popup.addTo(map);
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

    removePopup() {
        if (this.popup) { this.popup.remove(); }
    }

    makePopup(item, lngLat, popupOffset, closeOnClick) {
        const popupHTML = this.popupFactory.htmlForItem(item);
        const popup = new mapboxgl.Popup({
            closeOnClick: closeOnClick,
            offset: popupOffset,
            anchor: 'bottom'
        })
        popup.setLngLat(lngLat)
        popup.setHTML(popupHTML)

        return popup;
    }
}