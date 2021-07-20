

class MapContainerManager {
    constructor(backgroundInterface, webpageParser, mapManager, containerHTML, isMapHidden) {
        this.webpageParser = webpageParser;
        this.backgroundInterface = backgroundInterface;
        this.mapManager = mapManager;
        this.containerHTML = containerHTML;
        this.isMapHidden = isMapHidden;
    }

    async start() {
        this.addContainerToPageIfNeeded()
        .then(this.updateItems.bind(this))
        .catch(e => logError(e));
    }

    async updateItems() {
        let items = this.webpageParser.parseItems();
        log("Parse items : " + items.length + " items were found on the page.");
        
        log("Please wait for geocoding...")
        const geocodedItems = await this.backgroundInterface.getGeocodedItems(items);
        log("Geocoding done ! Will update the map with " + geocodedItems.length + " geocoded items.");
        this.mapManager.updateItems(geocodedItems);
    }

    async addContainerToPageIfNeeded() { 
        const self = this;

        // If the container already exists on the page, abort.
        const element = document.getElementById('lbca_button_toggle');
        if (element) {
            return Promise.resolve();
        }

        //Retrieve body
        let body = self.webpageParser.getBody();

        //Load the map container in the corner
        const container = new DOMParser().parseFromString(this.containerHTML, 'text/html').body.firstElementChild;
        body.appendChild(container);

        //Store DOM references for future usage
        this.mapContainer = $('#lbca_map_container');
        this.mapContainer = $('#lbca_map_container');
        this.toggleButton = $('#lbca_button_toggle');
        this.refreshButton = $('#lbca_button_refresh');
        this.blackOverlay = $('#lbca_black_overlay');

        self.updateToggleButtonText(this.isMapHidden);

        this.mapContainer.css('visibility', 'hidden');
        this.blackOverlay.css('visibility', 'hidden');
        this.refreshButton.css('visibility', 'hidden');

        //Finish setup
        await this.mapManager.loadMap();
        this.mapContainer.css('visibility', 'visible');
        this.blackOverlay.css('visibility', 'visible');
        this.refreshButton.css('visibility', 'visible');
        if (this.isMapHidden) {
            this.mapContainer.hide();
            this.blackOverlay.hide();
            this.refreshButton.hide();
        }

        self.toggleButton.click(toggleMap);
        self.blackOverlay.click(hideMap);
        self.refreshButton.click(refreshMap);

        function refreshMap() {
            self.updateItems();
            self.refreshButton.blur();
        }

        function toggleMap() {
            self.blackOverlay.fadeToggle(125);
            self.mapContainer.slideToggle(125, function() {
                var isMapHidden = self.mapContainer.is(":hidden");
                self.isMapHidden = isMapHidden;
                self.backgroundInterface.setIsMapHidden(isMapHidden);

                self.updateToggleButtonText(isMapHidden);
                self.refreshButton.toggle();

                self.toggleButton.blur();
            });
        }

        function hideMap() {
            const isMapHidden = self.mapContainer.is(":hidden");
            if (isMapHidden) { return; }

            self.blackOverlay.fadeOut(125);
            self.mapContainer.slideToggle(125, function() {
                self.isMapHidden = true;
                self.backgroundInterface.setIsMapHidden(true);
                self.updateToggleButtonText(true);
                self.refreshButton.hide();
            });
        }

        return Promise.resolve();
    }

    updateToggleButtonText(isMapHidden) {
        this.toggleButton.html(isMapHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
    }
}
