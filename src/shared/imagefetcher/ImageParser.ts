import { adsFromHtml, imageOfAd } from "~shared/parser/nextdata";
import { idFromUrl } from "~shared/parser/webpageparser";

const LBC_IMAGE_REGEX = /https:\/\/img\.leboncoin\.fr\/api\/v1\/[^"'\s<>\\]+/g;

export class ImageParser {
    /*
       Extract the main image of an ad from the HTML of its page.
       Tries, in order: embedded Next.js data, og:image meta tag, any leboncoin image URL.
     */
    static getAdImageFromHtml(html: string, adUrl?: string): string | undefined {
        // 1. Embedded JSON data (most reliable). Prefer the ad matching the url, not a "similar ads" one.
        const ads = adsFromHtml(html);
        const id = adUrl ? idFromUrl(adUrl) : undefined;
        const ad = ads.find(a => id && String(a.list_id) === id) ?? ads[0];
        const jsonImage = imageOfAd(ad);
        if (jsonImage) { return jsonImage; }

        // 2. og:image
        const og = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/.exec(html)
            ?? /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/.exec(html);
        if (og && /img\.leboncoin\.fr/.test(og[1])) { return decodeHtml(og[1]); }

        // 3. Any leboncoin image URL in the page
        const any = html.match(LBC_IMAGE_REGEX);
        if (any?.length) { return decodeHtml(any[0]); }

        return undefined;
    }

    // Leboncoin pages protected by DataDome return a captcha page instead of the ad.
    static isBotChallenge(html: string): boolean {
        return /captcha-delivery\.com|datadome/i.test(html) && !/__NEXT_DATA__/.test(html);
    }
}

function decodeHtml(value: string): string {
    return value.replace(/&amp;/g, "&");
}
