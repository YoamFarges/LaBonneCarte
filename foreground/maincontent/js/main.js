$(document).ready(function() {
    var parser = new WebpageParser();
    var backgroundInterface = new BackgroundInterface();
    backgroundInterface.synchronizeWithBackground().then(didFinishBackgroundSynchronization);

    function didFinishBackgroundSynchronization() {
        let items = parser.parseItems();
        console.log(items.length + " items were found !");
        backgroundInterface.updateItems(parser.parseItems());

        var mapContainerManager = new MapContainerManager(backgroundInterface, parser);

        let containerURL = chrome.extension.getURL('foreground/mapcontainer/html/mapcontainer.html');
        $.get(containerURL, (content) => {
            mapContainerManager.injectContainerHTMLContent(content);
        }, 'html');
    }
});
