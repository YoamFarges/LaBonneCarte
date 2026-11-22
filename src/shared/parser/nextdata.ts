import type { Item } from "./item";
import { DEBUG, debug } from "~shared/debug";

/*
   Leboncoin is a Next.js app: the server-rendered page embeds its data in
   <script id="__NEXT_DATA__">. Ads found there carry precise coordinates and
   image URLs, which is far more reliable than scraping the visible cards.

   The exact path of the ads array changes between page types (search, real estate,
   shop...), so we walk the whole JSON and pick every object that looks like an ad.

   Caveat: after a client-side navigation (e.g. going to page 2), this script is NOT
   updated. Callers must only use these ads to enrich cards actually present in the DOM.
 */

export function adsFromNextData(document: Document): Map<string, Item> {
    const result = new Map<string, Item>();
    const script = document.getElementById("__NEXT_DATA__");
    if (!script?.textContent) {
        if (DEBUG) { logEmbeddedDataDiagnostics(document); }
        return result;
    }

    let json: unknown;
    try {
        json = JSON.parse(script.textContent);
    } catch (e) {
        console.warn("LaBonneCarte - Unable to parse __NEXT_DATA__", e);
        return result;
    }

    const ads = findAds(json);
    debug.log(`__NEXT_DATA__ found (${script.textContent.length} chars), ${ads.length} ad objects inside`);
    if (ads[0]) { debug.log("First embedded ad (raw):", ads[0]); }
    return itemsFromAds(ads);
}

function itemsFromAds(ads: any[]): Map<string, Item> {
    const result = new Map<string, Item>();
    for (const ad of ads) {
        const item = itemFromAd(ad);
        if (item?.id) { result.set(item.id, item); }
    }
    return result;
}

// One download per URL: re-opening the map on the same page does not hit leboncoin again.
const fetchedPages = new Map<string, Promise<Map<string, Item>>>();

/*
   Download a leboncoin page and extract its embedded ads. Used when the current
   document's __NEXT_DATA__ is stale (client-side navigation).
 */
export function fetchAdsOfPage(url: string): Promise<Map<string, Item>> {
    let pending = fetchedPages.get(url);
    if (!pending) {
        pending = (async () => {
            try {
                const response = await fetch(url, { credentials: "include" });
                const html = await response.text();
                if (!response.ok || !/__NEXT_DATA__/.test(html)) {
                    debug.warn(`Download of ${url} gave no usable data (HTTP ${response.status}${/captcha-delivery|datadome/i.test(html) ? ", bot protection page" : ""})`);
                    fetchedPages.delete(url);
                    return new Map<string, Item>();
                }
                return itemsFromAds(adsFromHtml(html));
            } catch (e) {
                debug.warn(`Download of ${url} failed`, e);
                fetchedPages.delete(url);
                return new Map<string, Item>();
            }
        })();
        fetchedPages.set(url, pending);
    }
    return pending;
}

/*
   No __NEXT_DATA__: find out where the ads data lives now (App Router flight data, JSON-LD, ...).
 */
function logEmbeddedDataDiagnostics(document: Document) {
    const scripts = Array.from(document.scripts);
    const describe = (s: HTMLScriptElement) => ({
        id: s.id,
        type: s.type,
        src: s.src.slice(0, 80),
        length: s.textContent?.length ?? 0,
        start: (s.textContent ?? "").slice(0, 80),
    });
    const flight = scripts.filter(s => s.textContent?.includes("__next_f"));
    const withListId = scripts.filter(s => /list_?[iI]d/.test(s.textContent ?? ""));
    const jsonLd = scripts.filter(s => s.type === "application/ld+json");

    debug.log(`No __NEXT_DATA__. ${scripts.length} scripts in page: ${flight.length} Next.js flight (__next_f), ${withListId.length} mentioning list_id/listId, ${jsonLd.length} JSON-LD`);
    debug.table(withListId.map(describe));
    for (const s of withListId.slice(0, 2)) {
        const text = s.textContent ?? "";
        const i = text.search(/list_?[iI]d/);
        debug.log("Sample around list_id:", text.slice(Math.max(0, i - 300), i + 1200));
    }
    if (jsonLd[0]) { debug.log("First JSON-LD:", jsonLd[0].textContent?.slice(0, 1500)); }
}

/*
   Extract every ad JSON object from an arbitrary HTML string (used on fetched ad pages).
 */
export function adsFromHtml(html: string): any[] {
    const match = /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    if (!match) { return []; }
    try {
        return findAds(JSON.parse(match[1]));
    } catch {
        return [];
    }
}

export function looksLikeAd(value: any): boolean {
    return value != null
        && typeof value === "object"
        && value.list_id != null
        && typeof value.subject === "string";
}

function findAds(root: unknown): any[] {
    const ads: any[] = [];
    const seen = new Set<unknown>();
    const stack: unknown[] = [root];
    while (stack.length > 0) {
        const value = stack.pop();
        if (value == null || typeof value !== "object" || seen.has(value)) { continue; }
        seen.add(value);

        if (looksLikeAd(value)) {
            ads.push(value);
            continue;
        }
        for (const child of Object.values(value as object)) {
            if (child != null && typeof child === "object") { stack.push(child); }
        }
    }
    return ads;
}

export function imageOfAd(ad: any): string | undefined {
    const images = ad?.images;
    if (!images) { return undefined; }
    return images.small_url
        ?? images.thumb_url
        ?? images.urls?.[0]
        ?? images.urls_thumb?.[0]
        ?? images.urls_large?.[0];
}

function itemFromAd(ad: any): Item | undefined {
    const id = String(ad.list_id);
    const location = ad.location ?? {};
    const city: string = location.city ?? location.city_label ?? "";
    const postCode: string = location.zipcode ?? "";

    const lat = Number(location.lat);
    const lng = Number(location.lng);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

    return {
        id,
        title: ad.subject ?? "",
        price: formatPrice(ad),
        date: formatDate(ad.first_publication_date ?? ad.index_date),
        city,
        postCode,
        location: [city, postCode].filter(Boolean).join(" "),
        linkUrl: ad.url ?? "",
        imageUrl: imageOfAd(ad),
        coordinates: hasCoordinates ? { lat, lng } : undefined
    };
}

function formatPrice(ad: any): string {
    let value: number | undefined;
    if (Array.isArray(ad.price) && typeof ad.price[0] === "number") {
        value = ad.price[0];
    } else if (typeof ad.price === "number") {
        value = ad.price;
    } else if (typeof ad.price_cents === "number") {
        value = ad.price_cents / 100;
    }
    if (value === undefined) { return ""; }
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatDate(raw: unknown): string {
    if (typeof raw !== "string") { return ""; }
    // Leboncoin format: "2024-05-12 14:03:22" (Paris time)
    const date = new Date(raw.replace(" ", "T"));
    if (isNaN(date.getTime())) { return ""; }
    return date.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
