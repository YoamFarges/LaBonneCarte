function log(text) {
    console.log("[LaBonneCarte] " + text);
}

$(document).ready(function() {
    var parser = new WebpageParser();
    var backgroundInterface = new BackgroundInterface();
    backgroundInterface.synchronizeWithBackground().then(didFinishBackgroundSynchronization);

    function didFinishBackgroundSynchronization() {
        let items = parser.parseItems();
        log(items.length + " items were found on the page!");
        backgroundInterface.updateItems(items);

        var mapContainerManager = new MapContainerManager(backgroundInterface, parser);
        retrieveMapContainerHTMLContent((content) => {
            mapContainerManager.injectContainerHTMLContent(content);
        });
    }

    function retrieveMapContainerHTMLContent(callback) {
        let containerURL = chrome.extension.getURL('foreground/mapcontainer/html/mapcontainer.html');
        $.get(containerURL, callback, 'html');
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(
        sender.tab
        ? "from a content script:" + sender.tab.url
        : "from the extension");
    });
