/*
    This chrome extension background thread just helps transitioning the content page data to
    the google maps iframe in order to display the markers correctly.

    It also caches the geocache data as the number of Google API call is limited.
*/

log("Loading background...");

const mapboxClient = mapboxSdk({ accessToken: mapboxAccessToken });
const geocodeCache = new GeocodeCache();
var geocodeAPI = new GeocodeAPI(geocodeCache, mapboxClient);

var isMapHidden = false;
var items = [];

log("Background is loaded and ready to rock. 👍")

chrome.runtime.onMessage.addListener(function(requestDTO, sender, sendResponse) {
    if (requestDTO.method == MethodKeys.SET_IS_MAP_HIDDEN) {
        let mapHiddenDTO = requestDTO.innerDTO;
        this.isMapHidden = mapHiddenDTO.isMapHidden;
        sendResponse(this.isMapHidden);
    }

    else if (requestDTO.method == MethodKeys.GET_IS_MAP_HIDDEN) {
        sendResponse(this.isMapHidden);
    }

    else if (requestDTO.method == MethodKeys.SET_ITEMS) {
        let itemsDTO = requestDTO.innerDTO;
        this.items = itemsDTO.items;
        dispatch(new RequestDTO(MethodKeys.DID_UPDATE_ITEMS, itemsDTO));
        sendResponse(this.items);
    }

    else if (requestDTO.method == MethodKeys.GET_ITEMS) {
        sendResponse(this.items);
    }

    else if (requestDTO.method == MethodKeys.GET_GEOCODE) {
        let getGeocodeDTO = requestDTO.innerDTO;
        let location = getGeocodeDTO.location;

        this.geocodeAPI.getGeocode(location).then(geocode => {
            sendResponse(geocode);
        });

        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }

    else if (requestDTO.method == MethodKeys.GET_EXTERNAL_JSON) {
        $.getJSON(request.url, sendResponse);

        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }

    return false;
});

// Redispatch a request to all leboncoin's content scripts listeners
function dispatch(requestDTO) {
    chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
            if (extractRootDomain(tab.url) !== "leboncoin.fr") {
                return;
            }

            chrome.tabs.sendMessage(tab.id, requestDTO);
        });            
    });
}

// Called when a tab is updated
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status !== "complete" || extractRootDomain(tab.url) !== "leboncoin.fr") {
        return;
    }
    
    const innerDTO = new RequestItemsUpdateDTO(tabId);
    const requestDTO = new RequestDTO(MethodKeys.REQUEST_ITEMS_UPDATE, innerDTO);

    log("A leboncoin's tab has been updated. Will request item update.")
    dispatch(requestDTO)
});



