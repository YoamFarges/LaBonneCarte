import { MapContainer, Marker, useMap } from 'react-leaflet'
import { TileLayer } from 'react-leaflet'
import L, { LatLngBounds, type LatLngBoundsLiteral } from 'leaflet'
import type { GeocodedItem } from '~shared/parser/item';
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useEffect, useRef, useState } from 'react';
import ReactDOMServer from "react-dom/server";
import LBCAPopup from './popup';
import { ImageFetcher, NO_IMAGE } from '~shared/imagefetcher/ImageFetcher';

const DEFAULT_CENTER = { lat: 46.34, lng: 2.6025 };
const DEFAULT_ZOOM = 4.5;
const ONE_MARKER_ZOOM = 10;

const PINICON = new L.Icon({
    iconUrl: chrome.runtime.getURL(`assets/pinicon_v4.png`),
    iconRetinaUrl: chrome.runtime.getURL(`assets/pinicon_v4@2x.png`),
    shadowUrl: chrome.runtime.getURL('assets/shadow.png'),
    iconSize: [23, 32],
    popupAnchor: [0, -31],
    iconAnchor: [11.5, 32],
    shadowAnchor: [9.5, 6]
});
// Same position a popup bound to a marker would have: default popup offset (0, 7) + icon popupAnchor (0, -31).
const POPUP_OFFSET = L.point(0, 7 - 31);

const createClusterCustomIcon = function (cluster) {
    return L.divIcon({
        html: `<p class="count">${cluster.getChildCount()}</p>`,
        className: 'lbca-marker-cluster',
        iconSize: L.point(32, 32, true),
    })
}

const imageFetcher = new ImageFetcher();
interface Props {
    geocodedItems: GeocodedItem[]
}
export default function LBCAMap({ geocodedItems }: Props) {
    const mapRef = useRef<L.Map | null>(null)

    /*
       Open a standalone popup on the map rather than binding it to the marker:
       marker.bindPopup() adds Leaflet's own click handler that toggles the popup, which
       closed it right after we opened it on every click after the first one.
     */
    async function onMarkerClick(index: number) {
        const map = mapRef.current;
        const selectedItem = geocodedItems[index];
        if (!map || !selectedItem) {
            console.error("LaBonneCarte - Map or item not available for marker " + index);
            return;
        }

        const render = (imageUrl: string) => ReactDOMServer.renderToString(
            <LBCAPopup item={selectedItem} imageUrl={imageUrl} />
        );

        // openOn() closes any popup already open on the map.
        const popup = L.popup({ offset: POPUP_OFFSET })
            .setLatLng(selectedItem.coordinates)
            .setContent(render(selectedItem.imageUrl ?? NO_IMAGE))
            .openOn(map);
        if (selectedItem.imageUrl) { return; }

        const imageUrl = await imageFetcher.adImageOfItem(selectedItem);
        // Only update if the user did not close it or open another popup meanwhile.
        if (popup.isOpen()) {
            popup.setContent(render(imageUrl));
        }
    }

    return (
        <MapContainer id="lbca_map"
            ref={mapRef}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            boundsOptions={{ padding: [10, 10] }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MarkerClusterGroup maxClusterRadius={0} chunkedLoading iconCreateFunction={createClusterCustomIcon}>
                {geocodedItems.map((item, index) => (
                    <Marker
                        key={index}
                        position={item.coordinates}
                        icon={PINICON}
                        eventHandlers={{
                            click: (_) => {
                                onMarkerClick(index)
                            }
                        }}
                    >
                    </Marker>
                ))}
            </MarkerClusterGroup>

            <Bounds items={geocodedItems} />
        </MapContainer>
    )
}

interface BoundProps {
    items: GeocodedItem[]
}
// Hook necessary because MapContainer.bounds is immutable.
// https://stackoverflow.com/a/66842177
function Bounds({ items }: BoundProps) {
    const map = useMap();

    useEffect(() => {
        if (!map) {
            return;
        }

        if (items.length == 0) {
            map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM);
            return;
        }

        if (items.length == 1) {
            map.flyTo(items[0].coordinates, ONE_MARKER_ZOOM);
            return
        }

        const latLngBoundsLiteral: LatLngBoundsLiteral = items.map((item) => [item.coordinates.lat, item.coordinates.lng]);
        const bounds: LatLngBounds = new LatLngBounds(latLngBoundsLiteral);
        map.fitBounds(bounds);

    }, [map, items]);

    return null;
}