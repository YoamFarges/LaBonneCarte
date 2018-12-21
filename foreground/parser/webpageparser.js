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
    Retrieve the title of the page.

    - Returns: a javascript node object if found. Null otherwise.
    */
    getPageTitleNode() {
        var bgMain = document.querySelector(".bgMain");
        if (!bgMain) { return null; }
        return bgMain.querySelector("h1");
    }

    /*
    Retrieve the offers inside the document.

    - Returns: an array of Item objects.
    */
    parseItems() {
        var nodes = this.document.querySelectorAll('[itemtype="http://schema.org/Offer"], [itemtype="http://schema.org/Demand"]');
        return Array.from(nodes).map(itemFromNodes);

        /*
        Map a Node <li> object from the leboncoin's page to an Item object usable
        by our extension.

        - Returns: an Item object
        */
        function itemFromNodes(node) {
            var item = new Item();

            var a = node.querySelector("a");
            item.title = a.getAttribute("title").trim();

            item.linkUrl = appendHost(a.getAttribute('href'));

            var price = node.querySelector('[itemprop="price"]');
            item.price = price ? price.innerText : "";

            var category = node.querySelector('[itemprop="alternateName"]');
            item.category = category ? category.innerText : "";

            var location = node.querySelector('[itemprop="availableAtOrFrom"]');
            item.location = location ? location.innerText: "";

            var date = node.querySelector('[itemprop="availabilityStarts"]');
            item.date = date ? date.getAttribute("content") : "";

            var img = node.querySelector("img");
            var imgSrc = img ? img.getAttribute("src") : null;
            item.pictureUrl = imgSrc ? imgSrc : chrome.extension.getURL('foreground/map/img/no_image.jpg');

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
}
