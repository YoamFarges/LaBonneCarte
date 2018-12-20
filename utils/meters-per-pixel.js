function metersPerPixel(latitude, zoomLevel) {
    var earthCircumference = 40075017;
    var latitudeRadians = latitude * (Math.PI / 180);
    return ((earthCircumference * Math.cos(latitudeRadians)) / Math.pow(2, zoomLevel + 8));
}

function latitudeOffsetForPixels(pixels, currentLatitude, zoomLevel) {
    const mpp = metersPerPixel(currentLatitude, zoomLevel);
    return (pixels * mpp) / 111111;
}