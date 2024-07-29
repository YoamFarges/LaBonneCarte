import {MapContainer, Marker, Popup} from 'react-leaflet'
import {TileLayer} from 'react-leaflet'
import L from 'leaflet'
import type {GeocodedItem, Item} from '~shared/models/item';

const DEFAULT_CENTER = {lat: 46.34, lng: 2.6025};
const DEFAULT_ZOOM = 4.5;
const PINICON = new L.Icon({
    iconUrl: chrome.runtime.getURL(`assets/markers/pinicon.png`),
    iconRetinaUrl: chrome.runtime.getURL(`assets/markers/pinicon.png`),
    shadowUrl: chrome.runtime.getURL('assets/markers/marker-shadow.png'),
    popupAnchor: [-0, -36],
    iconSize: [24, 36],
    iconAnchor: [12, 36],
});

interface Props {
    geocodedItems: GeocodedItem[]
}
export default function LBCAMap({geocodedItems}: Props) {
    return (
        <MapContainer id="lbca_map" center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom={true}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geocodedItems.map((item) => (
                <Marker key={item.linkUrl} position={item.coordinates} icon={PINICON}>
                    <Popup>
                        A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}