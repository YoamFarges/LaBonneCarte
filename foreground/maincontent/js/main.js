$(document).ready(function () {
    log("Thank you for using LaBonneCarte ❤️");

    var parser = new WebpageParser();
    var backgroundInterface = new BackgroundInterface();
    var mapContainerManager = new MapContainerManager(backgroundInterface, parser);

    mapContainerManager.init();
    updateItems();

    function updateItems() {
        let items = parser.parseItems();
        log(items.length + " items were found on the page!");
        backgroundInterface.setItems(items);
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    log(
        sender.tab
            ? "from a content script:" + sender.tab.url
            : "from the extension");
});
