/*
    This chrome extension background thread just helps transitioning the content page data to 
    the google maps iframe in order to display the markers correctly.
    
    It also caches the geocache data as the number of Google API call is limited.
    
    Mandatory: request.method, as the name of the 'method' to call.
*/
var itemList = null;
var cachedGeocodeList = [];
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.method == "setItemList" && request.itemList) {
        console.log('set item list');
        itemList = request.itemList;
    } else if (request.method == "getItemList") {
        sendResponse({itemList: itemList});
    } else if (request.method == "searchGeocode") {
        console.log('search geocode list for location' + request.location);
       sendResponse(JSON.stringify(cachedGeocodeList[request.location]));
    } else if (request.method == "insertGeocode") {
        var geocode = new Geocode(request.location, request.lat, request.lon);
        cachedGeocodeList[request.location] = geocode;
        
        console.log('new geocode cached');
        console.log(cachedGeocodeList);
    } else if (request.method == "getJSON") {
        console.log('request json over the web');
        $.getJSON(request.url, sendResponse);
        
        //We have to return true for asynchronous purposes.
        //Otherwise the background thread shuts down and the callback is never called.
        return true;
    }
});