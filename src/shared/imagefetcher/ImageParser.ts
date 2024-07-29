
export class ImageParser {
    static getSmallAdImageFromHtml(html:string) : string | undefined {
        //Regex to match following format https://img.leboncoin.fr/api/v1/lbcpb1/images/7e/bc/86/7ebc86a938109e279a3430427184d5bcdc4b2f19.jpg?rule=ad-thumb
        const regex = new RegExp("^.*img\.leboncoin\.fr\/api.*[jpg,png].*rule=ad-thumb");
        const images = imageUrlsFromHtml(html);
        const image = images.find(value => regex.exec(value));
        if (!image) { return undefined; }
        return image.replace("rule=ad-thumb", "rule=ad-small");
    }
}

function imageUrlsFromHtml(html:string) : string[] {
    const imgRex = /<img.*?src="(.*?)"[^>]+>/g;
    const images = [];
    let img;
    while ((img = imgRex.exec(html))) {
        images.push(img[1]);
    }
    return images;
}