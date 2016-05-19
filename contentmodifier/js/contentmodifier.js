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

    //Load the html file to inject in the page
    $.get(url, function(content) {injectedContentReceived(content, titleNode)}, 'html');
});

/*-------------------------*\
    INJECT PAGE ELEMENTS
\*-------------------------*/

function injectedContentReceived(injectedContent, nodeToInject) {
    $(injectedContent).insertAfter(nodeToInject);
    var hideContainer = $('#lbca_hide_container');
    var button = $('#lbca_button');
    updateButtonText(button, iframeIsInitiallyHidden);
    
    if (iframeIsInitiallyHidden) {
        hideContainer.hide();
    } else {
        loadIframeIfNecessary();
    }
        
    button.click(function onButtonClick() {
        loadIframeIfNecessary(); 
               
        hideContainer.slideToggle(100, function() {
            updateButtonText(button, hideContainer.is(":hidden"));
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

