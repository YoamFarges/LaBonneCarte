var MethodKeys = {
    "UPDATE_ITEMS"                  : "updateItems",
    "DID_UPDATE_ITEMS"              : "didUpdateItems",

    "GET_IS_MAP_HIDDEN"             : "getIsMapHidden",
    "SET_IS_MAP_HIDDEN"             : "setIsMapHidden",

    "GET_CACHED_GEOCODE"            : "getCachedGeocode",
    "SET_CACHED_GEOCODE"            : "setCachedGeocode",

    "GET_JSON"                      : "getJSON",
}

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

class GetCachedGeocodeDTO {
    constructor(location) {
        this.location = location;
    }
}

class GetCachedGeocodeResponseDTO {
    constructor(geocode) {
        this.geocode = geocode;
    }
}

class SetCachedGeocodeDTO {
    constructor(geocode) {
        this.geocode = geocode;
    }
}

class GetJSONDTO {
    constructor(url) {
        
    }
}
