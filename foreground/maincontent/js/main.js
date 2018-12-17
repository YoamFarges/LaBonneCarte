$(document).ready(function () {
    log("Thank you for using LaBonneCarte ❤️");

    var parser = new WebpageParser();
    var backgroundInterface = new BackgroundInterface();
    var mapContainerManager = new MapContainerManager(backgroundInterface, parser);

    mapContainerManager.initIfNeeded();

    function updateItems() {
        let items = parser.parseItems();
        log("Update items... " + items.length + " items were found on the page!");
        return backgroundInterface.setItems(items);
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method == MethodKeys.REQUEST_ITEMS_UPDATE) {
            log("[main.js] ... background requests an item update");
            mapContainerManager.initIfNeeded();
            updateItems();
        }
    });
});
