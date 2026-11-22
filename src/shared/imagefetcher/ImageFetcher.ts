import type { Item } from "~shared/parser/item";
import { ImageParser } from "./ImageParser";
import { debug } from "~shared/debug";

export const NO_IMAGE = chrome.runtime.getURL(`assets/no_image.jpg`)

export class ImageFetcher {
    // Key = item.linkUrl. Stores the promise so concurrent clicks share a single request.
    private cache = new Map<string, Promise<string>>();

    adImageOfItem(item: Item): Promise<string> {
        // Best case: the image was already found in the search page, no network needed.
        if (item.imageUrl) {
            debug.log(`Image for "${item.title}" taken from the search page:`, item.imageUrl);
            return Promise.resolve(item.imageUrl);
        }
        debug.log(`No image in search page for "${item.title}", fetching ${item.linkUrl}`);

        let pending = this.cache.get(item.linkUrl);
        if (!pending) {
            pending = this.fetchImage(item);
            this.cache.set(item.linkUrl, pending);
        }
        return pending;
    }

    private async fetchImage(item: Item): Promise<string> {
        try {
            const response = await fetch(item.linkUrl, { credentials: "include" });
            const html = await response.text();

            if (!response.ok || ImageParser.isBotChallenge(html)) {
                console.warn(`LaBonneCarte - Ad page blocked or unavailable (HTTP ${response.status}): ${item.linkUrl}`);
                // Don't cache failures: a later attempt may succeed.
                this.cache.delete(item.linkUrl);
                return NO_IMAGE;
            }

            const imageUrl = ImageParser.getAdImageFromHtml(html, item.linkUrl);
            if (!imageUrl) {
                console.log("LaBonneCarte - No image found in " + item.linkUrl);
                return NO_IMAGE;
            }
            return imageUrl;
        } catch (err) {
            console.error("LaBonneCarte - Impossible to fetch " + item.linkUrl, err);
            this.cache.delete(item.linkUrl);
            return NO_IMAGE;
        }
    }
}
