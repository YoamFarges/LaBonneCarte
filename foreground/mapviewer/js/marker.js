class MarkerFactory {
    constructor(backgroundInterface, popupFactory) {
        this.backgroundInterface = backgroundInterface;
        this.popupFactory = popupFactory;
    }

    makeMarker(item, callback) {
        this.backgroundInterface.getGeocode(item.location).then(geocode => {
            const marker = new Marker(item, geocode, this.popupFactory);
            callback(marker);
        });
    }
}

class Marker {
    constructor(item, geocode, popupFactory) {
        this.popupFactory = popupFactory;
        this.item = item;
        this.geocode = geocode;
        this.lngLat = new mapboxgl.LngLat(geocode.longitude, geocode.latitude);

        this.mapboxMarker = this.makeMapboxMarker();
    }

    makeMapboxMarker() {
        var element = document.createElement("div");
        element.className = "marker";

        return new mapboxgl.Marker(element)
            .setLngLat(this.lngLat)
            .setPopup(this.popupFactory.popupForItem(this.item));
    }
}

class PopupFactory {
    constructor(template) {
        this.template = template;
    }

    popupForItem(item) {
        return new mapboxgl
            .Popup({ offset: 25 })
            .setHTML(this.popupHTMLForItem(item));
    }

    popupHTMLForItem(item) {
        var content = this.template;
        content = content.replace('__TITLE__', item.title);
        content = content.replace('__CATEGORY__', item.category);
        content = content.replace('__DATE__', item.date);
        content = content.replace('__LOCATION__', item.location);
        content = content.replace('__PRICE__', item.price);
        content = content.replace('__LINKURL__', item.linkUrl);
        content = content.replace('__PICTUREURL__', item.pictureUrl);
        if (item.pictureUrl == null) { content.replace('__HIDDEN__', 'hidden'); }
        else { content.replace('__HIDDEN__', ''); }
        return content;
    }
}