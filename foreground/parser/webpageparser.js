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
        const h1 = this.document.querySelector('h1');
        const nodes = Array.from(this.document.querySelectorAll('a[data-qa-id="aditem_container"]'));
        log("Parsed " + nodes.length + " nodes on page.")

        const filteredNodes = nodes.filter(node => h1.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING);
        log("Only keep " + filteredNodes.length + " nodes by excluding the ones above the h1.");

        const items = Array.from(filteredNodes).map(itemFromNode).filter(e => e != null);
        log("Transformed " + filteredNodes.length + " nodes into " + items.length + " items.")

        return items;

        /*
        Map a Node <li> object from the leboncoin's page to an Item object usable
        by our extension.

        - Returns: an Item object
        */
        function itemFromNode(node) {
            const item = new Item();

            // Find title
            const title = node.querySelector('[data-qa-id="aditem_title"]').getAttribute("title").trim();
            item.title = title ? title : "";

            // Find link
            item.linkUrl = appendHost(node.getAttribute('href'));

            // Find price
            const price = node.querySelector('[data-qa-id="aditem_price"]');
            item.price = price ? price.innerText : "";

            // Find all relevant innerTexts of the node
            const texts = Array
                .from(node.querySelectorAll("div, p, span"))
                .filter(e => e.querySelectorAll("div, p, span").length === 0)
                .map(e => e.innerText)
                .filter(e => e && e.length > 3)
                .filter(e => e != title)

            // Attempt to find location (mandatory)
            // Examples:
            // - Paris 75001
            // - Limoges 87000
            // - Lyon 69005 5e arrondissement
            const locationRegex = new RegExp("^(.* [0-9]{5})");
            const location = texts.find(value => locationRegex.exec(value));
            if (!location) {
                return null;
            }
            item.location = location;

            const locationFirstMatch = locationRegex.exec(location)[0]; //Capture the first pattern (i.e transforms "Lyon 69005 5e arrondissement" into "Lyon 69005")
            const locationSplit = locationFirstMatch.split(' ');
            item.postCode = locationSplit[locationSplit.length - 1];
            locationSplit.pop();
            item.city = locationSplit.join(' ');

            // Attempt to find date
            const timeRegex = new RegExp("^.* [0-9]{2}:[0-9]{2}$");
            const date = texts.find(value => timeRegex.exec(value));
            item.date = date ? date : "";

            item.pictureUrl = null;

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

    static getImagesFromHtml(html) {
        const imgRex = /<img.*?src="(.*?)"[^>]+>/g;
        const images = [];
        let img;
        while ((img = imgRex.exec(html))) {
            images.push(img[1]);
        }
        return images;
    }

    static getSmallAdImageFromHtml(html) {
        //Regex to match following format https://img.leboncoin.fr/api/v1/lbcpb1/images/7e/bc/86/7ebc86a938109e279a3430427184d5bcdc4b2f19.jpg?rule=ad-thumb
        const regex = new RegExp("^.*img\.leboncoin\.fr\/api.*[jpg,png].*rule=ad-thumb");
        const images = this.getImagesFromHtml(html);
        const image = images.find(value => regex.exec(value));
        if (!image) { return null; }
        return image.replace("rule=ad-thumb", "rule=ad-small");
    }
}