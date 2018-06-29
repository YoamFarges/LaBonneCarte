/*
Class that aims at gathering data of a leboncoin's page.

Warning:
If the page's layout or the class names change this method will need to be updated.
*/
class WebpageParser {
    constructor() {
        this.document = document;
    }

    /*
    Retrieve the offers inside the document.

    - Returns: an array of Item objects.
    */
    function parseItems() {
        var offersNodeList = this.document.querySelectorAll('[itemtype="http://schema.org/Offer"]');
        return Array.from(offersNodeList).map(itemFromOffer);
    }

    /*
    Retrieve the title of the page.

    - Returns: a javascript node object if found. Null otherwise.
    */
    function getPageTitleNode() {
         var titleNode = document.querySelector(".bgMain").querySelector("h1");
         return titleNode;
    }

    /*
    Retrieve the footer pagination container.

    - Returns: a jQuery object if found. Null otherwise.
    */
    function getFooterPagination() {
        var pagination = $(".googleafs").next();
        return pagination;
    }

    /*
    ** Private
    */

    /*
    Map an Offer <li> object from the leboncoin's page to an Item object usable
    by our extension.

    - Returns: an Item object
    */
    function itemFromOffer(offer) {
        var item = new Item();

        var a = offer.querySelector("a");
        item.title = a.getAttribute("title").trim();

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

    /*
    Transforms a leboncoin relative link into an absolute link.

    - Params:
    -- path: a relative path (e.g. "/ameublements/1234.html")
    - Returns: an absolute url (e.g. "https://leboncoin.fr/ameublements/1234.html")
    */
    function appendHost(path) {
        if (path) {
            var protocol = window.location.protocol;
            var host = window.location.host;
            return protocol + '//' + host + path;
        }

        return null;
    }
}
