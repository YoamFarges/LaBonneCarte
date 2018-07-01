/*
Proxy class to simplify the communication TO the background.js
*/
class BackgroundInterface {
    constructor() {
        this.mIsMapHidden = null;
    }

    synchronizeWithBackground() {
        var isMapHiddenPromise = new Promise(function(resolve, reject) {
            chrome.extension.sendMessage({method: MessageKeys.IS_MAP_HIDDEN}, callback);
            var that = this;
            function callback(response) {
                that.mIsMapHidden = response.isMapHidden;
                resolve();
            }
        }.bind(this));

        return Promise.all([isMapHiddenPromise]);
    }

    get isMapHidden() {
        return this.mIsMapHidden;
    }

    set isMapHidden(newValue) {
        chrome.extension.sendMessage({
            method: MessageKeys.SET_IS_MAP_HIDDEN,
            isMapHidden : newValue
        });

        this.mIsMapHidden = newValue;
    }

    updateItems(items) {
        chrome.extension.sendMessage({
            method: MessageKeys.UPDATE_ITEMS,
            items: items
        });
    }
}
