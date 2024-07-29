export interface LatLng {
    lat: number,
    lng: number
}

export interface Item {
    title: string;
    price: string;
    date: string;
    city: string;
    location: string;
    postCode: string;
    linkUrl: string;
}

export interface GeocodedItem extends Item {
   coordinates:LatLng
}