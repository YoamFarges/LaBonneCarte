/*
Proxy class to simplify the communication TO the background.js
*/
class BackgroundInterface {
    constructor() { }

    isMapHidden() {
        return new Promise(resolve => {
            let requestDTO = new RequestDTO(MethodKeys.GET_IS_MAP_HIDDEN);
            chrome.extension.sendMessage(requestDTO, function callback(isMapHidden) {
                resolve(isMapHidden);
            });
        });
    }

    setIsMapHidden(isMapHidden) {
        return new Promise(resolve => {
            let requestDTO = new RequestDTO(MethodKeys.SET_IS_MAP_HIDDEN, isMapHidden);
            chrome.extension.sendMessage(requestDTO, function callback(isMapHidden) {
                resolve(isMapHidden);
            });
        });
    }

    getGeocodedItems(items) {
        return new Promise(resolve => {
            let requestDTO = new RequestDTO(MethodKeys.GET_GEOCODED_ITEMS, items);
            chrome.extension.sendMessage(requestDTO, function callback(geocodedItems) {
                resolve(geocodedItems);
            });
        });
    }
}