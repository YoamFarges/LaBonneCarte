class AdImageCache {
    constructor(imageUrlsMap = new Map()) {
        this.imageUrlsMap = imageUrlsMap;
    }

    imageUrlWithAdUrl(adUrl) {
        let imgUrl = this.imageUrlsMap.get(adUrl);
        if (imgUrl === undefined) { return null; }
        return imgUrl;
    }

    cacheImage(adUrl, imgUrl) {
        if (adUrl == null) { return; }
        if (imgUrl == null) { return; }
        this.imageUrlsMap.set(adUrl, imgUrl);
    }
}
