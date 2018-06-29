var UNIQUE_MAP_VIEWER_ID = 'lbca_iframe'; 
var latitude = -1;
var longitude = -1;

function onRenderMap() {
    var mapViewerDOM = document.getElementById(UNIQUE_MAP_VIEWER_ID);
    if (mapViewerDOM) {
        mapViewerDOM.parentNode.removeChild(mapViewerDOM);
    }
    
    mapViewerDOM = document.createElement('iframe');
    mapViewerDOM.setAttribute('id', UNIQUE_MAP_VIEWER_ID);
    mapViewerDOM.setAttribute('src', chrome.extension.getURL('map_viewer.html'));
    mapViewerDOM.setAttribute('frameBorder', '0');
    mapViewerDOM.setAttribute('width', '99.90%');
    mapViewerDOM.setAttribute('height', '100%');
    mapViewerDOM.setAttribute('style', 'position: fixed; top: 0; left: 0; overflow: hidden; z-index: 99999');
    mapViewerDOM.onload = function(e) {
        sendResponse({
            method: 'RenderMap', 
            data: {
                latitude: latitude,
                longitude: longitude
            }
        });
    }
    document.body.appendChild(mapViewerDOM);
}

$(document).ready(function() {onRenderMap();});
