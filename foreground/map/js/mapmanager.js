class MapManager {
    constructor(popupFactory) {
        this.popupFactory = popupFactory;
        this.markers = [];

        this.franceBounds = { center: [2.6025, 46.34], zoom: 4.5 }
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
                    
                    log("Map manager did load map");
                    resolve();
                });
            });
        });
    }

    clearItems() {
        if (!this.spiderifier || !this.map) { return; }

        this.removePopup();
        this.spiderifier.unspiderfy();
        const geojsonData = GeocodedItem.geoJSONFeatureCollection([]);
        this.map.getSource("pins").setData(geojsonData);
    }

    updateItems(geocodedItems) {
        log(`Map will update with ${geocodedItems.length} geocoded items`);

        const geojsonData = GeocodedItem.geoJSONFeatureCollection(geocodedItems);
        this.map.getSource("pins").setData(geojsonData);
        this.fitMapBoundingBox(geojsonData);

        log("Map manager did update geojson data");
    }

    fitMapBoundingBox(geojsonData) {
        const map = this.map;

        var seen = {};
        const uniqueCoordinates = 
        geojsonData.features
        .map(f => f.geometry.coordinates)
        .filter(function(item) {
            return seen.hasOwnProperty(item) ? false : (seen[item] = true);
        });
        
        if (uniqueCoordinates.length == 0) {
            this.map.easeTo(this.franceBounds);
            return;
        }

        if (uniqueCoordinates.length == 1) {
            const zoom = map.getZoom();
            const targetZoom = clamp(zoom, 8, 10);
            map.easeTo({ center: uniqueCoordinates[0], zoom: targetZoom });
            return;
        }

        var bounds = new mapboxgl.LngLatBounds();
        uniqueCoordinates.forEach(coordinates => {
            bounds.extend(coordinates);
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
            clusterRadius: 1,
        });

        map.addLayer({
            id: 'pins',
            type: 'symbol',
            source: 'pins',
            layout: {
                "icon-image": "custom-icon-image",
                "icon-offset": [0, -18],
                "icon-allow-overlap": true,
                "icon-ignore-placement": true,
            },
            filter: ['all', ['!has', 'point_count']]
        });

        map.addLayer({
            id: 'cluster-pins',
            type: 'circle',
            source: 'pins',
            filter: ['all', ['has', 'point_count']],
            paint: {
                'circle-color': "#8e1c10",
                'circle-radius': 12
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

                self.removePopup();
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

        map.on('zoomstart', function () {
            self.removePopup();
            spiderifier.unspiderfy();
        });

        map.on('click', function(e) {
            self.removePopup();
            spiderifier.unspiderfy();

            var features = map.queryRenderedFeatures(e.point, {layers: ["pins", "cluster-pins"]});
            if (features.length > 1) {
                map.easeTo({center: e.lngLat, zoom: map.getZoom() + 2});
                e.originalEvent.cancelBubble = true;
            }
        });

        map.on('click', 'pins', function(e) {
            if (e.originalEvent.cancelBubble) { return; }

            self.removePopup();
            spiderifier.unspiderfy();

            const feature = e.features[0];
            if (!feature) { return; }

            const featureCenter = feature.geometry.coordinates;
            const featureLngLat = {lng: featureCenter[0], lat: featureCenter[1]};
            const item = feature.properties;

            map.easeTo({ center: featureLngLat, offset: {x: 0, y: 200, z: 0} });
            self.popup = self.makePopup(item, featureLngLat, 36, true);
            self.popup.addTo(map);
        });

        map.on('click', 'cluster-pins', function(e) {
            if (e.originalEvent.cancelBubble) { return; }

            const feature = e.features[0];
            if (!feature) { return; }

            const featureCenter = feature.geometry.coordinates;
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

        map.on('mouseenter', 'pins', function(e) {
            map.getCanvas().style.cursor = 'pointer'
        });

        map.on('mouseleave', 'pins', function() {
            map.getCanvas().style.cursor = '';
        });

        map.on('mouseenter', 'cluster-pins', function(e) {
            map.getCanvas().style.cursor = 'pointer'
        });

        map.on('mouseleave', 'cluster-pins', function() {
            map.getCanvas().style.cursor = '';
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