import {MapContainer, Marker} from 'react-leaflet'
import {TileLayer} from 'react-leaflet'
import L from 'leaflet'
import type {GeocodedItem} from '~shared/parser/item';
import LBCAPopup from './popup';
import {useRef} from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster'


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
const PINICON_CLUSTER = new L.Icon({
    iconUrl: chrome.runtime.getURL(`assets/pinicon_cluster.png`),
    iconRetinaUrl: chrome.runtime.getURL(`assets/pinicon_cluster@2x.png`),
    shadowUrl: chrome.runtime.getURL('assets/shadow.png'),
    iconSize: [30, 36],
    popupAnchor: [-1, -36],
    iconAnchor: [15, 35],
    shadowAnchor: [7, 1]
});
const createClusterCustomIcon = function (cluster) {
    return L.divIcon({
      html: `<p class="count">${cluster.getChildCount()}</p>`,
      className: 'lbca-marker-cluster',
      iconSize: L.point(32, 32, true),
    })
  }

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

            <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterCustomIcon}>
                {geocodedItems.map((item, index) => (
                    <Marker
                        key={index}
                        position={item.coordinates}
                        icon={PINICON}>
                        <LBCAPopup item={item} />
                    </Marker>
                ))}
            </MarkerClusterGroup>
        </MapContainer>
    )
}