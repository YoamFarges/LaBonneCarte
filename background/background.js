/*
    This chrome extension background thread just helps transitioning the content page data to 
    the google maps iframe in order to display the markers correctly.
    
    It also caches the geocache data as the number of Google API call is limited.
    
    Mandatory: request.method, as the name of the 'method' to call.
*/
var mapHidden = true;
var itemList = null;
var cachedGeocodeList = [];
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
     if (request.method == "setMapHidden" && request.itemList) {
        mapHidden = request.mapHidden;
    } else if (request.method == "getMapHidden") {
        sendResponse({mapHidden: mapHidden});
    } else if (request.method == "setItemList" && request.itemList) {
        itemList = request.itemList;
    } else if (request.method == "getItemList") {
        sendResponse({itemList: itemList});
    } else if (request.method == "searchGeocode") {
        var result = getCachedGeocodeWithLocation(request.location);
        if (result) {result = JSON.stringify(result);}
        sendResponse(result);
    } else if (request.method == "insertGeocode") {
        var geocode = new Geocode(request.location, request.lat, request.lng);
        cachedGeocodeList.push(geocode);
    } else if (request.method == "getJSON") {
        $.getJSON(request.url, sendResponse);
        
        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }
});

//Utils
function getCachedGeocodeWithLocation(location) {
    var result = null;
    $.each(cachedGeocodeList, function(index, item) {
        if (item.location == location) {
            result = item;
            return false;
        }
    });
    return result;
}