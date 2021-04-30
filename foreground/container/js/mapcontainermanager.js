

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
        const button = document.getElementById("lbca_button");
        if (button) {
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
        this.button = $('#lbca_button');
        this.blackOverlay = $('#lbca_black_overlay');

        //Finish setup
        await this.mapManager.loadMap();
        if (this.isMapHidden) {
            this.mapContainer.hide();
            this.blackOverlay.hide();
        }

        self.updateButtonText(this.isMapHidden);
        self.button.click(handleClick);
        self.blackOverlay.click(hideMap);

        function handleClick() {
            if (self.isMapHidden) {
                self.updateItems();
            }

            self.blackOverlay.fadeToggle(125);
            self.mapContainer.slideToggle(125, function() {
                var isMapHidden = self.mapContainer.is(":hidden");
                self.isMapHidden = isMapHidden;
                self.backgroundInterface.setIsMapHidden(isMapHidden);
                self.updateButtonText(isMapHidden);
                self.updateOverlay(isMapHidden);

                self.button.blur();
            });
        }

        function hideMap() {
            const isMapHidden = self.mapContainer.is(":hidden");
            if (isMapHidden) { return; }

            self.blackOverlay.fadeOut(125);
            self.mapContainer.slideToggle(125, function() {
                self.isMapHidden = true;
                self.backgroundInterface.setIsMapHidden(true);
                self.updateButtonText(true);
                self.updateOverlay(true);
            });
        }

        return Promise.resolve();
    }

    updateButtonText(isMapHidden) {
        this.button.html(isMapHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
    }

    updateOverlay(isMapHidden) {
        isMapHidden ? this.blackOverlay.hide() : this.blackOverlay.show();
    }
}
