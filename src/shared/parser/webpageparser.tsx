import type { Item } from "./item";
import { adsFromNextData, fetchAdsOfPage } from "./nextdata";
import { DEBUG, debug } from "~shared/debug";

// Leboncoin changes its markup regularly: try every known card selector.
const CARD_SELECTORS = [
    '[data-qa-id="aditem_container"]',
    '[data-test-id="ad"]',
    'article[data-test-id]',
];

export class WebpageParser {
    document: Document;

    constructor(document: Document) {
        this.document = document;
    }

    async getItems(): Promise<Item[]> {
        const nodes = this.findCardNodes();
        console.log(`LaBonneCarte - Found ${nodes.length} ad cards in page.`);

        const domIds = nodes
            .map(node => idFromUrl(absoluteUrl(node.querySelector('a[href]')?.getAttribute('href') ?? node.closest('a[href]')?.getAttribute('href')) ?? ""))
            .filter((id): id is string => !!id);
        const jsonAds = await this.embeddedAds(domIds);
        console.log(`LaBonneCarte - Found ${jsonAds.size} ads in embedded page data.`);

        debug.group("Parsing page");

        const items: Item[] = [];
        const report: object[] = [];
        const seenIds = new Set<string>();
        nodes.forEach((node, index) => {
            const { item: domItem, texts } = itemFromNode(node);
            const row = (status: string, item?: Partial<Item>) => report.push({
                "#": index,
                status,
                id: item?.id ?? "",
                title: (item?.title ?? "").slice(0, 40),
                city: item?.city ?? "",
                postCode: item?.postCode ?? "",
                coords: item?.coordinates ? `${item.coordinates.lat},${item.coordinates.lng}` : "",
                price: item?.price ?? "",
                date: item?.date ?? "",
                image: item?.imageUrl ? "yes" : "no",
                texts: texts.join(" | ").slice(0, 200),
            });

            if (!domItem) {
                row("DROPPED: no link found in card");
                debug.warn(`Card #${index} dropped: no link. HTML:`, node.outerHTML.slice(0, 500));
                return;
            }

            const key = domItem.id ?? domItem.linkUrl;
            if (seenIds.has(key)) {
                row("DROPPED: duplicate", domItem);
                return;
            }
            seenIds.add(key);

            const jsonItem = domItem.id ? jsonAds.get(domItem.id) : undefined;
            const merged = mergeItems(domItem, jsonItem);
            if (!merged.postCode && !merged.coordinates) {
                row(texts.length === 0 ? "DROPPED: card is empty (not rendered yet?)" : "DROPPED: no postcode in texts", merged);
                debug.warn(`Card #${index} dropped: no postcode/coordinates.`, { linkUrl: merged.linkUrl, texts, inEmbeddedData: !!jsonItem, element: node });
                return;
            }

            row(jsonItem ? "KEPT (dom + embedded data)" : "KEPT (dom only)", merged);
            items.push(merged);
        });
        debug.table(report);

        const dropped = nodes.length - items.length;
        console.log(`LaBonneCarte - Transformed ${nodes.length} cards into ${items.length} items (${dropped} dropped).`);
        debug.groupEnd();
        return items;
    }

    /*
       Ads embedded in the page (__NEXT_DATA__). After a client-side navigation this data belongs
       to the previous page: in that case, download the current URL once to get fresh data.
     */
    private async embeddedAds(domIds: string[]): Promise<Map<string, Item>> {
        const inPage = adsFromNextData(this.document);
        const matching = domIds.filter(id => inPage.has(id)).length;
        debug.log(`Embedded data in page: ${inPage.size} ads, ${matching}/${domIds.length} match the cards`);
        if (domIds.length === 0 || matching >= domIds.length / 2) { return inPage; }

        debug.log(`Embedded data is stale or missing: downloading ${window.location.href}`);
        const fetched = await fetchAdsOfPage(window.location.href);
        const fetchedMatching = domIds.filter(id => fetched.has(id)).length;
        debug.log(`Downloaded data: ${fetched.size} ads, ${fetchedMatching}/${domIds.length} match the cards`);
        return fetchedMatching >= matching ? fetched : inPage;
    }

    private findCardNodes(): HTMLElement[] {
        let nodes: HTMLElement[] = [];
        for (const selector of CARD_SELECTORS) {
            nodes = Array.from(this.document.querySelectorAll<HTMLElement>(selector));
            debug.log(`Selector ${selector}: ${nodes.length} nodes`);
            if (nodes.length > 0) { break; }
        }

        // Exclude "sponsored"/"recently viewed" carousels located above the main title, when there is one.
        const h1 = this.document.querySelector('h1');
        if (h1) {
            const belowH1 = nodes.filter(node => h1.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
            debug.log(`h1 "${h1.innerText?.trim().slice(0, 60)}": ${belowH1.length}/${nodes.length} cards below it`);
            if (belowH1.length > 0) { nodes = belowH1; }
        } else {
            debug.log("No h1 in page: keeping all cards");
        }
        return nodes;
    }
}

/*
   DOM values describe what the user actually sees; JSON values fill the gaps
   and bring precise coordinates + images.
 */
function mergeItems(dom: Item, json?: Item): Item {
    if (!json) { return dom; }
    return {
        id: dom.id,
        title: dom.title || json.title,
        price: dom.price || json.price,
        date: dom.date || json.date,
        city: dom.city || json.city,
        postCode: dom.postCode || json.postCode,
        location: dom.location || json.location,
        linkUrl: dom.linkUrl || json.linkUrl,
        // Embedded data lists the ad's own pictures; the card may also contain the seller's avatar.
        imageUrl: json.imageUrl || dom.imageUrl,
        coordinates: json.coordinates,
    };
}


/*
   Map a card node from the leboncoin's page to an Item object usable by our extension.
   Returns null when no link can be found.
 */
function itemFromNode(node: HTMLElement): { item: Item | null, texts: string[] } {
    // Find all relevant innerTexts of the node (leaf elements only)
    const allTexts = (Array.from(node.querySelectorAll("div, p, span")) as HTMLElement[])
        .filter(e => e.querySelectorAll("div, p, span").length === 0)
        .map(e => e.innerText?.trim())
        .filter(e => e && e.length > 3);

    // Find link (the card itself may be the <a>)
    const linkElement = node.matches('a[href]')
        ? node
        : (node.querySelector('a[href*="/ad/"], a[href$=".htm"], a[href]') ?? node.closest('a[href]'));
    const linkUrl = absoluteUrl(linkElement?.getAttribute('href'));
    if (!linkUrl) { return { item: null, texts: allTexts }; }

    // Find title. Multiple selectors for different pages of leboncoin
    const titleElement = node.querySelector<HTMLElement>('[data-test-id="adcard-title"], [data-qa-id="aditem_title"], h2, h3');
    const title = titleElement?.innerText?.trim()
        || linkElement?.getAttribute('title')?.trim()
        || node.querySelector('img[alt]')?.getAttribute('alt')?.trim()
        || "";

    const texts = allTexts.filter(e => e != title);

    // Find price
    let price = node.querySelector<HTMLElement>('[data-qa-id="aditem_price"], [data-test-id="price"]')?.innerText?.trim() ?? "";
    if (!price) {
        price = texts.find(value => /[0-9][0-9\s  .,']*€/.test(value)) ?? "";
    }

    // Find location. Examples:
    // - Paris 75001
    // - Limoges 87000
    // - Lyon 69005 5e arrondissement
    // - Saint-Étienne (42000)
    let city = "";
    let postCode = "";
    let location = "";
    // The city may only contain letters, spaces, - ' . and the postcode must be exactly 5 digits.
    // Otherwise car cards' 'Année: "2023". Kilométrage: "32490 km"' gives postcode 32490.
    const locationRegex = /^([A-Za-zÀ-ÿŒœ][A-Za-zÀ-ÿŒœ' .\-]*?)[\s,]*\(?([0-9]{5})\)?(?![0-9])/;
    for (const text of texts) {
        const match = locationRegex.exec(text);
        if (match && match[1]) {
            location = text;
            city = match[1].replace(/[,·•]\s*$/, "").trim();
            postCode = match[2];
            break;
        }
    }

    // Find date
    const date = texts.find(value => /[0-9]{1,2}:[0-9]{2}$/.test(value))
        ?? texts.find(value => /[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(value))
        ?? "";

    const item: Item = {
        id: idFromUrl(linkUrl),
        title,
        price,
        date,
        city,
        location,
        postCode,
        linkUrl,
        imageUrl: imageFromNode(node),
    };
    return { item, texts: allTexts };
}

/*
   Main picture of the card. Cards may also contain the seller's avatar / shop logo, so instead of
   the first image we take the biggest one on screen (the photo slot has its size even before
   the lazy-loaded picture arrives), skipping anything that looks like an avatar or a logo.
 */
function imageFromNode(node: HTMLElement): string | undefined {
    const candidates = Array.from(node.querySelectorAll('img'))
        .map(img => {
            const url = [
                img.currentSrc,
                img.getAttribute('src'),
                img.getAttribute('data-src'),
                firstSrcsetUrl(img.getAttribute('srcset')),
                firstSrcsetUrl(img.closest('picture')?.querySelector('source')?.getAttribute('srcset')),
            ].find(c => c && /img\.leboncoin\.fr/.test(c));
            const rect = img.getBoundingClientRect();
            // Not the alt text: it is usually the ad title, which can contain any word.
            const hint = `${url ?? ""} ${img.className ?? ""}`;
            return { url, area: rect.width * rect.height, isAvatar: /avatar|logo/i.test(hint) };
        })
        .filter(c => c.url && !c.isAvatar)
        .sort((a, b) => b.area - a.area);

    if (DEBUG && candidates.length > 1) {
        debug.log("Card image candidates (biggest first):", candidates.map(c => `${Math.round(c.area)}px² ${c.url}`));
    }
    return candidates[0]?.url;
}

function firstSrcsetUrl(srcset: string | null | undefined): string | undefined {
    return srcset?.split(',')[0]?.trim().split(/\s+/)[0] || undefined;
}

// "https://www.leboncoin.fr/ad/velos/2712345678" or ".../2712345678.htm" -> "2712345678"
export function idFromUrl(url: string): string | undefined {
    return /\/(\d{6,})(?:\.htm)?\/?(?:[?#].*)?$/.exec(url)?.[1];
}

function absoluteUrl(path: string | null | undefined): string | null {
    if (!path) { return null; }
    try {
        return new URL(path, window.location.href).toString();
    } catch {
        return null;
    }
}
