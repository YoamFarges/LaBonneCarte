class MapContainerManager() {
    constructor(isMapInitiallyHidden) {
        this.isMapInitiallyHidden = isMapInitiallyHidden;
        this.viewURL = chrome.extension.getURL('maincontent/html/injectedcontent.html');
    }

    function injectContainerBelowNode(node) {

    }

    function cloneFooterPagination(footerPagination) {
        if (!footerPagination) {
            console.log("Impossible to clone pagination footer. Object was not found.");
            return;
        }
    }

    function injectedContentReceived(injectedContent, nodeToInjectAfter, mapIsHidden) {
        $(injectedContent).insertAfter(nodeToInjectAfter);
        var hideContainer = $('#lbca_hide_container');
        var button = $('#lbca_button');
        updateButtonText(button, mapIsHidden);

        //Clone the pagination just below the map
        var footer = getFooterPagination();
        footer.css("margin-top", "1em");
        if (footer) {hideContainer.append(footer.clone());}

        if (mapIsHidden) {
            hideContainer.hide();
        } else {
            loadIframeIfNecessary();
        }

        button.click(function onButtonClick() {
            loadIframeIfNecessary();

            hideContainer.slideToggle(100, function() {
                var hidden = hideContainer.is(":hidden");
                saveMapHiddenState(hidden);
                updateButtonText(button, hidden);
            });
        });
    }

    function loadIframeIfNecessary() {
        var mapIframe = $('#lbca_iframe');
        if (mapIframe.attr('src') === undefined) {
            mapIframe.attr('src', chrome.extension.getURL('mapviewer/html/mapviewer.html'));
        }
    }
}
