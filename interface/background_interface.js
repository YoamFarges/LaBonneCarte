/*
Proxy class to simplify the communication TO the background.js
*/
class BackgroundInterface {
    constructor() {
        this.mIsMapHidden = null;
    }

    synchronizeWithBackground() {
        var isMapHiddenPromise = new Promise(function(resolve, reject) {
            let requestDTO = new RequestDTO(MethodKeys.GET_IS_MAP_HIDDEN);

            var self = this;
            chrome.extension.sendMessage(requestDTO, function callback(mapHiddenDTO) {
                that.mIsMapHidden = mapHiddenDTO.isMapHidden;
                resolve();
            });
        }.bind(this));

        return Promise.all([isMapHiddenPromise]);
    }

    get isMapHidden() {
        return this.mIsMapHidden;
    }

    set isMapHidden(newValue) {
        this.mIsMapHidden = newValue;

        let mapHiddenDTO = new MapHiddenDTO(newValue);
        let requestDTO = new RequestDTO(MethodKeys.SET_IS_MAP_HIDDEN, mapHiddenDTO);
        chrome.extension.sendMessage(requestDTO);
    }

    updateItems(items) {
        let itemsDTO = new ItemsDTO(items);
        let requestDTO = new RequestDTO(MethodKeys.SET_ITEMS, itemsDTO);
        chrome.extension.sendMessage(requestDTO);
    }
}
