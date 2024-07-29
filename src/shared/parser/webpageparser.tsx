import type {Item} from "./item";

export class WebpageParser {
    document: Document;

    constructor(document: Document) {
        this.document = document;
    }

    getItems(): Item[] {
        const h1 = this.document.querySelector('h1');
        if (!h1) { 
            console.log("Cannot find H1 in page. Abort retrieving items.");
            return []
        }
        
        const nodes = Array.from(this.document.querySelectorAll('a[data-qa-id="aditem_container"]'));
        console.log("Parsed " + nodes.length + " nodes on page.")

        const filteredNodes = nodes.filter(node => h1.compareDocumentPosition(node) === Node.DOCUMENT_POSITION_FOLLOWING);
        console.log("Only keep " + filteredNodes.length + " nodes by excluding the ones above the h1.");

        const items = Array.from(filteredNodes).map(itemFromNode).filter(e => e != null);
        console.log("Transformed " + filteredNodes.length + " nodes into " + items.length + " items.")

        return items;
    }
}


/*
   Map a Node <li> object from the leboncoin's page to an Item object usable
   by our extension.

   - Returns: an Item object
 */
function itemFromNode(node): Item | null {
    // Find title
    let title = node.querySelector('[data-qa-id="aditem_title"]').getAttribute("title").trim();
    title = title ?? ""

    // Find link
    const linkUrl = appendHost(node.getAttribute('href'));

    // Find price
    let price = node.querySelector('[data-qa-id="aditem_price"]');
    price = price ? price.innerText : "";

    // Find all relevant innerTexts of the node        
    const texts = (Array.from(node.querySelectorAll("div, p, span")) as HTMLElement[])
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

    //Capture the first pattern (i.e transforms "Lyon 69005 5e arrondissement" into "Lyon 69005")
    const locationFirstMatch = locationRegex.exec(location)[0];
    const locationSplit = locationFirstMatch.split(' ');
    const postCode = locationSplit[locationSplit.length - 1];
    locationSplit.pop();
    const city = locationSplit.join(' ');

    // Attempt to find date
    const timeRegex = new RegExp("^.* [0-9]{2}:[0-9]{2}$");
    let date = texts.find(value => timeRegex.exec(value));
    date = date ?? "";

    const item: Item = {
        title: title,
        price: price,
        date: date,
        city: city,
        location: location,
        postCode: postCode,
        linkUrl: linkUrl
    }
    return item;
}

/*
**   Transforms a leboncoin relative link into an absolute link.

    - Params:
    -- path: a relative path (e.g. "/ameublements/1234.html")
    - Returns: an absolute url (e.g. "https://leboncoin.fr/ameublements/1234.html")
    */
function appendHost(path: string): string {
    if (path) {
        var protocol = window.location.protocol;
        var host = window.location.host;
        return protocol + '//' + host + path;
    }

    return null;
}