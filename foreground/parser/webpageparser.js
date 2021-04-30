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
    - Returns the document's body
    */
    getBody() {
        return document.body;
    }

    /*
    Retrieve the offers inside the document.

    - Returns: an array of Item objects.
    */
    parseItems() {
        var nodes = this.document.querySelectorAll('a[data-qa-id="aditem_container"][class*=AdCard__AdCardLink]');
        return Array.from(nodes).map(itemFromNodes);

        /*
        Map a Node <li> object from the leboncoin's page to an Item object usable
        by our extension.

        - Returns: an Item object
        */
        function itemFromNodes(node) {
            let item = new Item();


            let title = node.querySelector('[data-qa-id="aditem_title"]').getAttribute("title").trim();
            item.title = title ? title : "";

            item.linkUrl = appendHost(node.getAttribute('href'));

            let price = node.querySelector("[class*=AdCardPrice__Amount]")
            item.price = price ? price.innerText : "";


            let textContents = node.querySelectorAll("[class*=TextContent__TextContentWrapper]");
            if (textContents && textContents.length >= 4) {
                // First textContent is price and thus ignored

                let category = textContents[1];
                item.category = category ? category.innerText : "";

                var location = textContents[2];
                location = location ? location.innerText : "";
                item.location = location;
                
                if (location) {
                    const lastIndex = location.lastIndexOf(' ');
                    if (lastIndex) {
                        item.city = location.substr(0, lastIndex);
                        item.postCode = location.substr(lastIndex + 1, location.length);
                    }
                }

                let date = textContents[3];
                item.date = date ? date.innerText : "";
            }

            // Image disabled due to LBC lazyloading preventing to retrieve images for non-visible items
            item.pictureUrl = chrome.extension.getURL('foreground/map/img/no_image.jpg');

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