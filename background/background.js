/*
    This chrome extension background thread just helps transitioning the content page data to
    the google maps iframe in order to display the markers correctly.

    It also caches the geocache data as the number of Google API call is limited.
*/
var geocodeCache = new GeocodeCache();
var isMapHidden = false;

chrome.runtime.onMessage.addListener(function(requestDTO, sender, sendResponse) {
    if (requestDTO.method == MethodKeys.SET_IS_MAP_HIDDEN) {
        let mapHiddenDTO = requestDTO.innerDTO;
        isMapHidden = mapHiddenDTO.isMapHidden;
        sendResponse(mapHiddenDTO);
    }

    else if (requestDTO.method == MethodKeys.GET_IS_MAP_HIDDEN) {
        let dto = new MapHiddenDTO(this.isMapHidden);
        sendResponse(dto);
    }

    else if (requestDTO.method == MethodKeys.UPDATE_ITEMS) {
        let itemsDTO = requestDTO.innerDTO;
        dispatch(new RequestDTO(MethodKeys.DID_UPDATE_ITEMS, itemsDTO));
        sendResponse(itemsDTO);
    }

    else if (requestDTO.method == MethodKeys.GET_CACHED_GEOCODE) {
        let getCachedGeocodeDTO = requestDTO.innerDTO;
        let location = getCachedGeocodeDTO.location;
        let geocode = this.geocodeCache.geocodeWithLocation(location);
        let responseDTO = new GetCachedGeocodeResponseDTO(geocode);
        sendResponse(responseDTO);
    }

    else if (requestDTO.method == MethodKeys.SET_CACHED_GEOCODE) {
        let setCachedGeocodeDTO = requestDTO.innerDTO;
        let geocode = setCachedGeocode.geocode;
        this.geocodeCache.cacheGeocode(geocode);
    }

    else if (requestDTO.method == MethodKeys.GET_JSON) {
        $.getJSON(request.url, sendResponse);

        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }

    return false;
});

// Redispatch a request to all content scripts listeners
function dispatch(requestDTO) {
    chrome.runtime.sendMessage(requestDTO, null);
}
