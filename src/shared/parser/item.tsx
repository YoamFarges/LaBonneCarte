export interface LatLng {
    lat: number,
    lng: number
}

export interface Item {
    id?: string;
    title: string;
    price: string;
    date: string;
    city: string;
    location: string;
    postCode: string;
    linkUrl: string;
    // Thumbnail found directly in the page (card <img> or embedded JSON). Avoids fetching the ad page.
    imageUrl?: string;
    // Precise coordinates when leboncoin exposes them (embedded JSON). Takes precedence over geocoding.
    coordinates?: LatLng;
}

export interface GeocodedItem extends Item {
    coordinates: LatLng
}
