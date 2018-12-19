class Marker {
    constructor(geocodedItem, popupFactory) {
        this.popupFactory = popupFactory;
        this.geocodedItem = geocodedItem;
        this.mapboxMarker = this.makeMapboxMarker();
    }

    get lngLat() {
        return this.geocodedItem.geocode.lngLat;
    }

    makeMapboxMarker() {
        var element = document.createElement("div");
        element.className = "marker";
        this.div = element;

        return new mapboxgl.Marker(element)
            .setLngLat(this.geocodedItem.geocode.lngLat)
            .setPopup(this.popupFactory.popupForItem(this.geocodedItem.item));
    }
}

class PopupFactory {
    constructor(template) {
        this.template = template;
    }

    popupForItem(item) {
        return new mapboxgl
            .Popup({ offset: 25, anchor:'bottom' })
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