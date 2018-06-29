/*-------------------------*\
    ENTRY POINT
\*-------------------------*/
var iframeIsInitiallyHidden = false;

var parser = new WebpageParser();
var background = new BackgroundInterface();

$(document).ready(function() {
    //Guard
    //if wrong page or if page layout have changed, we abort.
    var itemList = Item.getItemListFromPage();
    if (!itemList.length) {return;}
    var titleNode = getPageTitleNode();
    if (!titleNode) {
        console.log("The page title has not been found. Extension Labonnecarte won't be displayed.")
        return;}
    var url = chrome.extension.getURL('maincontent/html/injectedcontent.html');

   //Send the item list to the background page
   background.updateItems(itemList);

    //Get the map hidden status from the background page
    chrome.extension.sendMessage({method: 'getMapHidden'}, getMapHiddenCallback);
    function getMapHiddenCallback(response) {
         //Load the html file to inject in the page
         $.get(url, function(content) {injectedContentReceived(content, titleNode, response.mapHidden)}, 'html');
    }
});

/*-------------------------*\
    INJECT PAGE ELEMENTS
\*-------------------------*/

function injectedContentReceived(injectedContent, nodeToInjectAfter, mapIsHidden) {
    $(injectedContent).insertAfter(nodeToInjectAfter);
    var hideContainer = $('#lbca_hide_container');
    var button = $('#lbca_button');
    updateButtonText(button, mapIsHidden);

    //Clone the pagination just below the map
    var footer = getFooterPagination();
    footer.css("margin-top", "1em");
    if (footer) {hideContainer.append(footer.clone());}

    if (mapIsHidden) {
        hideContainer.hide();
    } else {
        loadIframeIfNecessary();
    }

    button.click(function onButtonClick() {
        loadIframeIfNecessary();

        hideContainer.slideToggle(100, function() {
            var hidden = hideContainer.is(":hidden");
            saveMapHiddenState(hidden);
            updateButtonText(button, hidden);
        });
    });
}

function loadIframeIfNecessary() {
    var mapIframe = $('#lbca_iframe');
    if (mapIframe.attr('src') === undefined) {
        mapIframe.attr('src', chrome.extension.getURL('mapviewer/html/mapviewer.html'));
    }
}

function sendItemsToBackgroundPage(itemList) {
}

function updateButtonText(button, hidden) {
    button.html(hidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
}

function saveMapHiddenState(hidden) {
    chrome.extension.sendMessage({method: 'setMapHidden', mapHidden:hidden});
}
