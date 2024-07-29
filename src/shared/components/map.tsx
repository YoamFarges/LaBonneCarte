import {MapContainer, Marker, Popup} from 'react-leaflet'
import {TileLayer} from 'react-leaflet'
import L from 'leaflet'
import type {GeocodedItem} from '~shared/parser/item';
import {ImageFetcher} from '~shared/imagefetcher/ItemAdImageFetcher';
import LBCAPopup from './popup';
import {useRef} from 'react';

const DEFAULT_CENTER = {lat: 46.34, lng: 2.6025};
const DEFAULT_ZOOM = 4.5;
const PINICON = new L.Icon({
    iconUrl: chrome.runtime.getURL(`assets/pinicon.png`),
    iconRetinaUrl: chrome.runtime.getURL(`assets/pinicon@2x.png`),
    shadowUrl: chrome.runtime.getURL('assets/shadow.png'),
    iconSize: [30, 36],
    popupAnchor: [-1, -36],
    iconAnchor: [15, 35],
    shadowAnchor: [7, 1]
});

interface Props {
    geocodedItems: GeocodedItem[]
}
export default function LBCAMap({geocodedItems}: Props) {
    const selectedMarkerRef = useRef(null)

    return (
        <MapContainer id="lbca_map" center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom={true}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {geocodedItems.map((item) => (
                <Marker
                    key={item.linkUrl}
                    position={item.coordinates}
                    icon={PINICON}
                    ref={selectedMarkerRef}>
                    <LBCAPopup item={item} />
                </Marker>
            ))}
        </MapContainer>
    )
}