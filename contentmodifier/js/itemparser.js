/*
    Quick helper method to gather the data of the leboncoin's page and store it under the form of
    an Item object.
    
    Not stable as if the page layout or the class names change we need to change this function.
*/
Item.getItemListFromPage = function () {
    var array = [];
    
    var itemList = $("section.tabsContent ul li");    
    itemList.each(function(index) {
        var item = new Item();
        item.title = strip($(this).find(".item_title").text());
        item.price = strip($(this).find(".item_price").text());
        
        var itemSupps = $(this).find(".item_supp");
        item.category = strip(itemSupps[0].textContent);
        item.location = strip(itemSupps[1].textContent);
        item.date = strip(itemSupps[2].textContent);
        
        var pics = $(this).find(".item_imagePic .lazyload");
        item.pictureUrl = fixLink(pics.attr('data-imgsrc'));
        item.linkUrl = fixLink($(this).find("a").attr('href'));
                
        array.push(item);
    });
        
    return array;
}

/////
//Util functions just used in this context.

function strip(text) {
    return jQuery.trim(text.replace(/\s\s+/g, ' '));
}

function fixLink(text) {
    if (text) {
        if (text.indexOf('//') == 0) {
            return 'https:' + text;
        }
        return text;
    }
    return null;
}
