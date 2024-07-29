import type {GeocodedItem} from "~shared/parser/item";
import {ImageParser} from "./ImageParser";

const NO_IMAGE = chrome.runtime.getURL(`assets/no_image.jpg`)

export class ImageFetcher {
    cache = new ImageCache()

    async adImageOfItem(item:GeocodedItem) : Promise<string> {
        console.log("ImageFetcher - Get image for " + item.title);

        let imageUrl = this.cache.getImageUrl(item);
        if (imageUrl) { 
            console.log("ImageFetcher - Image was already cached : " + imageUrl);
            return imageUrl;
        }
        
       imageUrl = await fetch(item.linkUrl)
        .then(response => response.text())
        .then(html => ImageParser.getSmallAdImageFromHtml(html))
        .then((imageUrl) => {
            if (!imageUrl) {
                console.log("ImageFetcher - Image was not found after fetching HTML " + item.linkUrl);

                return NO_IMAGE;
            }

            this.cache.cacheImageUrl(item, imageUrl);
            return imageUrl;
        })
        .catch(err => {
            console.error('LaBonneCarte - Impossible to fetch ' + item.linkUrl, err);
            return NO_IMAGE;
        });

        return imageUrl;
    }
}


/*
Basic cache to prevent re-fetching a LBC page if it was already done before.
*/
class ImageCache {
    // Key = item.linkUrl, Value = img url 
    imageUrlsMap = new Map<string, string>();

    getImageUrl(item:GeocodedItem): string | undefined {
        let imgUrl = this.imageUrlsMap.get(item.linkUrl);
        if (imgUrl === undefined) { return null; }
        return imgUrl;
    }

    cacheImageUrl(item:GeocodedItem, imgUrl : string): void {
        this.imageUrlsMap.set(item.linkUrl, imgUrl);
    }
}
