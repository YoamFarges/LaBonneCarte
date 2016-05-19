/*-------------------------*\
    ENTRY POINT
\*-------------------------*/
var iframeIsInitiallyHidden = false;

$(document).ready(function() {
    //Guard
    //if wrong page or if page layout have changed, we abort.
    var itemList = Item.getItemListFromPage();
    if (!itemList.length) {return;}
    var titleNode = getPageTitleNode();
    if (!titleNode) {return;}
    var url = chrome.extension.getURL('contentmodifier/html/injectedcontent.html');

   //Send the item list to the background page
    sendItemsToBackgroundPage(itemList);

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
    
    var footer = getFooterPagination().clone();
    hideContainer.append(footer);
    
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
    chrome.extension.sendMessage({method: 'setItemList', itemList: itemList});
}

function updateButtonText(button, hidden) {
    button.html(hidden ? 'Afficher la recherche sur la carte' : 'Masquer la carte');
}

function saveMapHiddenState(hidden) {
    chrome.extension.sendMessage({method: 'setMapHidden', mapHidden:hidden});
}

/*-------------------------*\
    PARSE THE CURRENT PAGE
\*-------------------------*/

/*
    Parse the page content to get the title of the page. Useful as we want to
    position our iframe under it.
    Returns: title node object if found. Null otherwise.
*/
function getPageTitleNode() {
     var titleNode = $('#main > section:first').children('h1').first();
     return titleNode.length ? titleNode : null;
}

function getFooterPagination() {
    var pagination = $("footer.pagination");
    return pagination.length ? pagination : null;
}

