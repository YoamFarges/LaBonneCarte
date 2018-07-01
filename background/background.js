/*
    This chrome extension background thread just helps transitioning the content page data to
    the google maps iframe in order to display the markers correctly.

    It also caches the geocache data as the number of Google API call is limited.

    Mandatory: request.method, as the name of the 'method' to call.
*/
var isMapHidden = false;
var items = null;
var cachedGeocodeList = [];

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == MessageKeys.SET_IS_MAP_HIDDEN) {
        isMapHidden = request.isMapHidden;
    }
    else if (request.method == MessageKeys.IS_MAP_HIDDEN) {
        sendResponse({isMapHidden: isMapHidden});
    }

    else if (request.method == MessageKeys.UPDATE_ITEMS && request.items) {
        items = request.items;
    }

    else if (request.method == MessageKeys.GET_ITEMS) {
        sendResponse({items: items});
    }

    else if (request.method == "searchGeocode") {
        var geocode = getCachedGeocodeWithLocation(request.location);
        if (geocode) {
            sendResponse(geocode.serialized());
        } else {
            sendResponse(null);
        }
    } else if (request.method == "insertGeocode") {
        var geocode = Geocode.withJson(request.geocode);
        cachedGeocodeList.push(geocode);
    } else if (request.method == "getJSON") {
        $.getJSON(request.url, sendResponse);

        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }

    return false;
});

//Utils
function getCachedGeocodeWithLocation(location) {
    var geocode = null;
    $.each(cachedGeocodeList, function(index, item) {
        if (item.location == location) {
            geocode = item;
            return false; //break;
        }
    });
    return geocode;
}
