const MethodKeys = {
    SET_ITEMS: "setItems",
    GET_ITEMS: "getItems",
    DID_UPDATE_ITEMS: "didUpdateItems",

    GET_IS_MAP_HIDDEN: "getIsMapHidden",
    SET_IS_MAP_HIDDEN: "setIsMapHidden",

    GET_GEOCODE: "getGeocode",

    REQUEST_ITEMS_UPDATE: "requestItemsUpdate"
};

/**
 * A request DTO maps a method key to an expected DTO.
 */
class RequestDTO {
    constructor(method, innerDTO = null) {
        this.method = method;
        this.innerDTO = innerDTO;
    }
}

class ItemsDTO {
    constructor(items) {
        this.items = items;
    }
}

class MapHiddenDTO {
    constructor(isMapHidden) {
        this.isMapHidden = isMapHidden;
    }
}

class GetGeocodeDTO {
    constructor(location) {
        this.location = location;
    }
}

/**
 * Called from the background.js to the content_scripts when a tab
 * did refresh and that the items on the page needs to be reparsed and updated.
 */
class RequestItemsUpdateDTO {
    constructor(tabId) {
        this.tabId = tabId;
    }
}
