class MapContainerManager {
    constructor(backgroundInterface, webpageParser) {
        this.webpageParser = webpageParser;
        this.backgroundInterface = backgroundInterface;

        this.mapViewerURL = chrome.extension.getURL('foreground/mapviewer/html/mapviewer.html');
    }

    injectContainerHTMLContent(htmlContent) {
        let self = this;

        var titleNode = self.webpageParser.getPageTitleNode();
        if (!titleNode) {
            console.log("The page title has not been found. Extension Labonnecarte won't be displayed.")
            return;
        }

        $(htmlContent).insertAfter(titleNode);

        self.hideContainer = $('#lbca_hide_container');
        self.button = $('#lbca_button');

        setupInitialHiddenState();
        setupButton();
        setupFooterPagination();

        console.log("Did successfully inject container");

        // Private methods

        function setupInitialHiddenState() {
            if (self.backgroundInterface.isMapHidden) {
                self.hideContainer.hide();
            } else {
                loadMapViewerIframeIfNeeded();
            }
        }

        function setupButton() {
            updateButtonText();
            self.button.click(function onButtonClick() {
                loadMapViewerIframeIfNeeded();
                let hideContainer = self.hideContainer;

                hideContainer.slideToggle(100, function() {
                    var isHidden = hideContainer.is(":hidden");
                    self.backgroundInterface.isMapHidden = isHidden;

                    updateButtonText();
                });
            });

            function updateButtonText() {
                var isHidden = self.backgroundInterface.isMapHidden;
                self.button.html(isHidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
            }
        }

        function loadMapViewerIframeIfNeeded() {
            var mapIframe = $('#lbca_iframe');
            if (mapIframe.attr('src') === undefined) {
                mapIframe.attr('src', self.mapViewerURL);
            }
        }

        function setupFooterPagination() {
            var footerPagination = self.webpageParser.getFooterPagination();
            if (!footerPagination) {
                console.log("Impossible to clone pagination footer. Object was not found.");
                return;
            }

            footerPagination.css("margin-top", "1em");
            self.hideContainer.append(footerPagination.clone());
        }
    }
}
