$(document).ready(function() {init();});
function init() {
    try {insertMapDiv();}
    catch(e) {
        console.log(e);
        return;
    }

    var mapDiv = $('#lbca_gmap');
    var button = $('#lbca_button');
    updateButtonText(button, mapDiv.is(":hidden"));
    
    //Initial state
    mapDiv.hide();
    button.click(function(){
        loadMapIfNeeded();
        toggleMapEnabled(mapDiv);
        updateButtonText(button, mapDiv.is(":hidden"));
    });
}

function insertMapDiv() {
    var title = $('#main > section:first').children('h1').first();
    if (!title.length) {
        throw "LaBonneCarte: Title not found"; //wrong page, probably
    }
    var contentSelector = 
    '<div id="lbca_container">'
    + '<button type="button" id="lbca_button" class="lbca_button">'
    + '</button>'
    + '<div id="lbca_gmap"></div>'
    + '</div>';
    $(contentSelector).insertAfter(title);
    return true;
}

var mapLoader = null;
function loadMapIfNeeded() {
    if (mapLoader == null) {
        mapLoader = new MapLoader(Item.getItemListFromPage());
        mapLoader.loadMap();
    }
}

function toggleMapEnabled(mapDiv) {
    mapDiv.slideToggle(100, function() {
        updateButtonText();
    });
}

function updateButtonText(button, hidden) {
    //Not localized for now, as the target website is only in french.
    button.html(hidden ? 'Afficher les éléments sur la carte' : 'Enlever la carte');
}

