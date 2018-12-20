//Approximation
//Source: https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters

function metersPerPixel(latitude, zoomLevel) {
    var earthCircumference = 40075017;
    var latitudeRadians = latitude * (Math.PI / 180);
    return ((earthCircumference * Math.cos(latitudeRadians)) / Math.pow(2, zoomLevel + 8));
}

function latitudeOffsetForPixels(pixels, currentLatitude, zoomLevel) {
    const mpp = metersPerPixel(currentLatitude, zoomLevel);
    return (pixels * mpp) / 111111;
}



function latitudeOffset(meters) {
    return meters / 111111;
}

function longitudeOffset(meters, latitude) {
    return meters / (Math.cos(latitude) * 111111);
}

function offsetedLngLatByPixel(lngLat, zoomLevel, xPixelOffset, yPixelOffset) {
    const lat = lngLat.lat;
    const lng = lngLat.lng;

    const mpp = metersPerPixel(lat, zoomLevel);
    const latOffset = latitudeOffset(mpp * yPixelOffset);
    const lngOffset = 0;//longitudeOffset(mpp * xPixelOffset, lat);
    const offsetedLngLat = {lng: lng + lngOffset, lat: lat + latOffset }

    return offsetedLngLat;
}