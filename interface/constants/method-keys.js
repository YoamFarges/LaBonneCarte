const MethodKeys = {
    GET_GEOCODED_ITEMS: "getGeocodedItems",

    GET_IS_MAP_HIDDEN: "getIsMapHidden",
    SET_IS_MAP_HIDDEN: "setIsMapHidden",
};

/**
 * A request DTO maps a method key with data.
 */
class RequestDTO {
    constructor(method, data = null) {
        this.method = method;
        this.data = data;
    }
}