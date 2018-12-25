class PopupFactory {
    constructor(template) {
        this.template = template;
    }

    static makePopup() {
        return new mapboxgl.Popup({ offset: 24, anchor:'bottom' })
    }

    htmlForItem(item) {
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