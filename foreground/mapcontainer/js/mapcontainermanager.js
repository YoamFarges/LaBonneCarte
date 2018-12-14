class MapContainerManager {
    constructor(backgroundInterface, webpageParser) {
        this.webpageParser = webpageParser;
        this.backgroundInterface = backgroundInterface;
        this.containerURL = chrome.extension.getURL('foreground/mapcontainer/html/mapcontainer.html');
        this.mapViewerURL = chrome.extension.getURL('foreground/mapviewer/html/mapviewer.html');
    }

    init() {
        const self = this;

        //Retrieve title
        var titleNode = self.webpageParser.getPageTitleNode();
        if (!titleNode) {
            logError("The page title has not been found. Extension Labonnecarte won't be displayed.")
            return;
        }
        
        //Read HTML file of the map container
        getHTMLContent(self.containerURL)
        .then(content => {
            //Load the map container below the title
            $(content).insertAfter(titleNode);

            //Store DOM references for future usage
            self.iFrameContainer = $('#lbca_iframe_container');
            self.button = $('#lbca_button');

            //Finish setup
            setupButtonClick();
            setupFooterPagination();
            setupInitialHiddenState();

            log("Did successfully load map container");
        })

        //
        // Private methods
        //

        function setupInitialHiddenState(isMapHidden) {
            self.backgroundInterface.isMapHidden().then(isMapHidden => {
                self.updateButtonText(isMapHidden);

                isMapHidden 
                ? self.iFrameContainer.hide()
                : self.loadMapViewerIframeIfNeeded();
            });
        }

        function setupButtonClick() {
            self.button.click(function onButtonClick() {
                self.loadMapViewerIframeIfNeeded();
                let iFrameContainer = self.iFrameContainer;

                iFrameContainer.slideToggle(100, function() {
                    var isHidden = iFrameContainer.is(":hidden");
                    self.backgroundInterface.setIsMapHidden(isHidden);
                    self.updateButtonText(isHidden);
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
            self.iFrameContainer.append(footerPagination.clone());
        }

        function  getHTMLContent(url) {
           return new Promise(function (resolve, reject) {
               $.get(url, content => resolve(content), 'html');
            });
        }
    }

    loadMapViewerIframeIfNeeded() {
        var mapIframe = $('#lbca_iframe');
        if (mapIframe.attr('src') === undefined) {
            mapIframe.attr('src', this.mapViewerURL);
        }
    }

    updateButtonText(isMapHidden) {
        this.button.html(isMapHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
    }
}
