$(document).ready(function () {
    runApp();
});

async function runApp() {
    log("Thank you for using LaBonneCarte ❤️");

    const popupTemplateHTML = await getHTML('foreground/map/html/popup.html');
    const containerHTML = await getHTML('foreground/container/html/mapcontainer.html');

    const backgroundInterface = new BackgroundInterface();
    const isMapHidden = await backgroundInterface.isMapHidden();

    const webpageParser = new WebpageParser();
    const popupFactory = new PopupFactory(popupTemplateHTML);
    const mapManager = new MapManager(popupFactory);
    const mapContainerManager = new MapContainerManager(backgroundInterface, webpageParser, mapManager, containerHTML, isMapHidden);

    async function updateItems() {
        let items = webpageParser.parseItems();
        log("Parse items : " + items.length + " items were found on the page.");
        log("Please wait for geocoding...")
        const geocodedItems = await backgroundInterface.getGeocodedItems(items);
        log("Geocoding done ! Will update the map with " + geocodedItems.length + " geocoded items.");
        mapManager.updateItems(geocodedItems);
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method == MethodKeys.TAB_DID_REFRESH) {
            log("Tab was refreshed. Will trigger item update if the map can be displayed on the current page.")
            mapManager.clearItems();
            
            mapContainerManager
            .addContainerToPageIfNeeded()
            .then(updateItems)
            .catch(e => logError(e));
        }
    });
}

function getHTML(url) {
    return new Promise(resolve => {
        var chromeURL = chrome.extension.getURL(url);
        $.get(chromeURL, (template => {
            resolve(template);
        }), 'html');
    });
}