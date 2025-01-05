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
    const markerRefs = useRef<Array<L.Marker<any> | null>>([])

    async function onMarkerClick(index) {
        const marker = markerRefs.current[index];
        if (!marker) {
            console.error("Marker not available in array of refs");
            return;
        }

        let popupString = ReactDOMServer.renderToString(
            <LBCAPopup item={geocodedItems[index]} imageUrl={NO_IMAGE} />
        );

        const selectedItem = geocodedItems[index];
        marker.bindPopup(popupString).openPopup();

        const imageUrl = await imageFetcher.adImageOfItem(selectedItem);
        popupString = ReactDOMServer.renderToString(
            <LBCAPopup item={geocodedItems[index]} imageUrl={imageUrl} />
        );
        marker.bindPopup(popupString).openPopup();
    }

    return (
        <MapContainer id="lbca_map"
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
                        ref={ref => markerRefs.current[index] = ref}
                        eventHandlers={{
                            click: (_) => {
                                onMarkerClick([index])
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