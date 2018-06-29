/*
Proxy class to simplify the communication TO the background.js
*/
class BackgroundInterface {
    constructor() {}

    function updateItems(items) {
        chrome.extension.sendMessage({method: MessageKeys.UPDATE_ITEMS, items: items});
    }

    function isMapHidden() {
        return new Promise(function(resolve, reject) {
            chrome.extension.sendMessage({method: MessageKeys.IS_MAP_HIDDEN}, callback);
            function callback(response) {
                resolve(response.mapHidden);
                //Load the html file to inject in the page
                $.get(url, function(content) {injectedContentReceived(content, titleNode, response.mapHidden)}, 'html');
            }
        }

    }
}
