/*
Proxy class to simplify the communication TO the background.js
*/
class BackgroundInterface {
    constructor() { }

    isMapHidden() {
        return new Promise(function (resolve, reject) {
            let requestDTO = new RequestDTO(MethodKeys.GET_IS_MAP_HIDDEN);
            chrome.extension.sendMessage(requestDTO, function callback(isMapHidden) {
                resolve(isMapHidden);
            });
        });
    }

    setIsMapHidden(newValue) {
        return new Promise(function (resolve, reject) {
            let mapHiddenDTO = new MapHiddenDTO(newValue);
            let requestDTO = new RequestDTO(MethodKeys.SET_IS_MAP_HIDDEN, mapHiddenDTO);
            chrome.extension.sendMessage(requestDTO, function callback(isMapHidden) {
                resolve(isMapHidden);
            });
        });
    }

    setItems(items) {
        return new Promise(function (resolve, reject) {
            let itemsDTO = new ItemsDTO(items);
            let requestDTO = new RequestDTO(MethodKeys.SET_ITEMS, itemsDTO);
            chrome.extension.sendMessage(requestDTO, function callback(items) {
                resolve(items);
            });
        });
    }

    getGeocode(location) {
        return new Promise(function (resolve, reject) {
            let dto = new GetGeocodeDTO(location);
            let requestDTO = new RequestDTO(MethodKeys.GET_GEOCODE, dto);
            chrome.extension.sendMessage(requestDTO, function callback(geocode) {
                resolve(geocode);
            });
        });
    }
}