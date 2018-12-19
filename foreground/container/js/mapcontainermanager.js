

class MapContainerManager {
    constructor(backgroundInterface, webpageParser, mapManager, containerHTML, isMapHidden) {
        this.webpageParser = webpageParser;
        this.backgroundInterface = backgroundInterface;
        this.mapManager = mapManager;
        this.containerHTML = containerHTML;
        this.isMapHidden = isMapHidden;
    }

    addContainerToPageIfNeeded() {
        // If the container already exists on the page, abort.
        const extensionContainer = document.getElementById("lbca_extension_container");
        if (extensionContainer) {
            return;
        }

        const self = this;

        //Retrieve title
        var titleNode = self.webpageParser.getPageTitleNode();
        if (!titleNode) {
            logError("The page title has not been found. Extension Labonnecarte won't be displayed.")
            return;
        }
        
        //Load the map container below the title
        $(this.containerHTML).insertAfter(titleNode);

        //Store DOM references for future usage
        this.mapContainer = $('#lbca_map_container');
        this.button = $('#lbca_button');

        //Finish setup
        this.mapManager.loadMap();
        if (this.isMapHidden) {
            this.mapContainer.hide();
        }

        self.updateButtonText(this.isMapHidden);
        setupButtonClick();        
        setupFooterPagination();

        log("Did successfully load map container");

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

        function setupFooterPagination() {
            var footerPagination = self.webpageParser.getFooterPagination();
            if (!footerPagination) {
                logError("Impossible to clone pagination footer. Object was not found.");
                return;
            }

            footerPagination.css("margin-top", "1em");
            self.mapContainer.append(footerPagination.clone());
        }
    }

    updateButtonText(isMapHidden) {
        this.button.html(isMapHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
    }
}
