/*
    This chrome extension background thread just helps transitioning the content page data to
    the google maps iframe in order to display the markers correctly.

    It also caches the geocache data as the number of Google API call is limited.
*/

log("Loading background...");

const geocodeCache = new GeocodeCache();
var geocodeAPI = new GeocodeAPI(geocodeCache);
var geocodedItemFactory = new GeocodedItemFactory(geocodeAPI);

var isMapHidden = false;

log("Background is loaded and ready to rock. 👍")

chrome.runtime.onMessage.addListener(function(requestDTO, sender, sendResponse) {
    if (requestDTO.method == MethodKeys.SET_IS_MAP_HIDDEN) {
        this.isMapHidden = requestDTO.data;
        sendResponse(this.isMapHidden);
    }

    else if (requestDTO.method == MethodKeys.GET_IS_MAP_HIDDEN) {
        sendResponse(this.isMapHidden);
    }

    else if (requestDTO.method == MethodKeys.GET_GEOCODED_ITEMS) {
        this.geocodedItemFactory.makeGeocodedItemsFromItems(requestDTO.data).then(geocodedItems => {
            sendResponse(geocodedItems);
        });

        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }

    return false;
});

// Called when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status !== "complete" || extractRootDomain(tab.url) !== "leboncoin.fr") {
        return;
    }

    const requestDTO = new RequestDTO(MethodKeys.TAB_DID_REFRESH, tabId);

    log(`The leboncoin's tab with ID ${tabId} has been updated.`)
    chrome.tabs.sendMessage(tabId, requestDTO);
});
