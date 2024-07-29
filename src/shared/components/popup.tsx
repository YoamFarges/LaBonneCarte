import type {GeocodedItem} from "~shared/parser/item"
interface Props {
    item: GeocodedItem,
    imageUrl: string
}
export default function LBCAPopup({item, imageUrl}: Props) {
    return <div className="lbca_popup">
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
}