/*
Method to gather the data of the leboncoin's page and store it under the form of
an array of Item objects.

Warning:
If the page's layout or the class names change this method will need to be updated.
*/
Item.getItemListFromPage = function () {
    var array = [];
    var offersNodeList = document.querySelectorAll('[itemtype="http://schema.org/Offer"]');
    return Array.from(offersNodeList).map(itemFromOffer);
}

function itemFromOffer(offer) {
    var item = new Item();

    var a = offer.querySelector("a");

    item.title = strip(a.getAttribute("title"));

    item.linkUrl = appendHost(a.getAttribute('href'));

    var price = offer.querySelector('[itemprop="price"]');
    item.price = price ? price.innerText + " €" : "";

    var category = offer.querySelector('[itemprop="alternateName"]');
    item.category = category ? category.innerText : "";

    var location = offer.querySelector('[itemprop="availableAtOrFrom"]');
    item.location = location ? location.innerText: "";

    var date = offer.querySelector('[itemprop="availabilityStarts"]');
    item.date = date ? category.getAttribute("content") : "";

    var img = offer.querySelector("img");
    var imgSrc = img ? img.getAttribute("src") : null;
    item.pictureUrl = imgSrc ? imgSrc : chrome.extension.getURL('mapviewer/img/no_image.jpg');

    return item;
}

/////
//Util functions just used in this context.

function strip(text) {
    return jQuery.trim(text.replace(/\s\s+/g, ' '));
}

function appendHost(path) {
    if (path) {
        var protocol = window.location.protocol;
        var host = window.location.host;
        return protocol + '//' + host + path;
    }

    return null;
}
