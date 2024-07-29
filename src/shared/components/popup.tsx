import {useCallback, useEffect, useState} from "react";
import {Popup} from "react-leaflet"
import {ImageFetcher} from "~shared/imagefetcher/ItemAdImageFetcher"
import type {GeocodedItem} from "~shared/parser/item"

const imageFetcher = new ImageFetcher();

interface Props {
    item: GeocodedItem
}
export default function LBCAPopup({item}: Props) {
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

    const fetchData = useCallback(async () => {
        const img = await imageFetcher.adImageOfItem(item);
        setImageUrl(img)
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData]);

    console.log("Render " + item.title);

    return <Popup>
        <div className="lbca_popup">
            <div className="bg">
                <img className="center" src={imageUrl} />
            </div>
            <h2>{item.title}</h2>
            <div>
                <p className="price">{item.price}</p>
                <p>{item.location}</p>
                <hr />
                <div className="clearfix">
                    <p className="float-left date">{item.date}</p>
                    <a href={item.linkUrl} target="_blank" className="float-right text-right">Voir l'annonce →</a>
                </div>
            </div>
        </div>
    </Popup>
}