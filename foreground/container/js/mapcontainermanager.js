

class MapContainerManager {
    constructor(backgroundInterface, webpageParser, mapManager, containerHTML, isMapHidden) {
        this.webpageParser = webpageParser;
        this.backgroundInterface = backgroundInterface;
        this.mapManager = mapManager;
        this.containerHTML = containerHTML;
        this.isMapHidden = isMapHidden;
    }

    async addContainerToPageIfNeeded() {
        // If the container already exists on the page, abort.
        const extensionContainer = document.getElementById("lbca_extension_container");
        if (extensionContainer) {
            return Promise.resolve();
        }

        const self = this;

        //Retrieve title
        var titleNode = self.webpageParser.getPageTitleNode();
        if (!titleNode) {
            return Promise.reject("The page title has not been found. Extension Labonnecarte won't be displayed.");
        }
        
        //Load the map container below the title
        $(this.containerHTML).insertAfter(titleNode);

        //Store DOM references for future usage
        this.mapContainer = $('#lbca_map_container');
        this.button = $('#lbca_button');

        //Finish setup
        await this.mapManager.loadMap();
        if (this.isMapHidden) {
            this.mapContainer.hide();
        }

        self.updateButtonText(this.isMapHidden);
        setupButtonClick();        

        log("Did finish loading map container");
        return Promise.resolve();

        function setupButtonClick() {
            self.button.click(function onButtonClick() {
                const mapContainer = self.mapContainer;
                
                mapContainer.slideToggle(100, function() {
                    var isContainerHidden = mapContainer.is(":hidden");
                    self.isMapHidden = isContainerHidden;
                    self.backgroundInterface.setIsMapHidden(isContainerHidden);
                    self.updateButtonText(isContainerHidden);
                });
            });
        }
    }

    updateButtonText(isMapHidden) {
        this.button.html(isMapHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
    }
}
