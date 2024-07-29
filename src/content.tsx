import leafletCss from "data-text:leaflet/dist/leaflet.css"
import lbcaCss from "data-text:~/shared/styles/overlay.less"
import popupCss from "data-text:~/shared/styles/popup.less"

import type {PlasmoCSConfig} from "plasmo"
import {useState} from "react"
import LBCAMap from "./shared/components/map"
import {WebpageParser} from "./shared/parser/webpageparser"
import {Geocoder} from "~shared/geocoder/geocoder"
import type {GeocodedItem, Item} from "~shared/parser/item"

console.log("♥️ Bienvenue sur LaBonneCarte.")

export const config: PlasmoCSConfig = {
  matches: ["*://*.leboncoin.fr/*", "*://*.piruzap.com/*", "*://*.plasmo.com/*"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = leafletCss + lbcaCss + popupCss;
  return style
}

const LBCAOverlay = () => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [geocodedItems, setGeocodedItems] = useState<GeocodedItem[]>([]);

  const mapContainerClasses = isMapVisible ? "visible slide" : "hidden fade";
  const refreshButtonClasses = isMapVisible ? "visible fade" : "hidden fade";
  const overlayClasses = isMapVisible ? "visible fade" : "hidden fade";
  const toggleButtonText = isMapVisible ? "Masquer" : "Carte"

  function toggleMap() {
    setIsMapVisible(!isMapVisible);

    if (!isMapVisible) {
      parseItemsInPage();
    }
  }

  function hideMap() {
    setIsMapVisible(false);
  }

  function pressRefreshButton() {
    parseItemsInPage()
  }

  function parseItemsInPage() {
    const parser = new WebpageParser(document);
    const items: Item[] = parser.getItems();
    console.log(`LaBonneCarte - Did find ${items.length} items in current page`);

    const geocodedItems = items
      .map((item) => {
        const commune = Geocoder.communeOfItem(item);
        if (!commune) {return undefined;}
        const geocodedItem: GeocodedItem = {
          ...item,
          coordinates: commune.coordinates
        }
        return geocodedItem
      })
      .filter((item) => item);

    console.log(`LaBonneCarte - Could geocode ${geocodedItems.length} items in current page`);

    setGeocodedItems(geocodedItems);
  }

  return (
    <div>
      <div id="lbca_black_overlay" className={overlayClasses} onClick={hideMap}></div>

      {isMapVisible &&
        <div id="lbca_map_container" className={mapContainerClasses}>
          <LBCAMap geocodedItems={geocodedItems} />
          <div id="lbca_warning">Certaines annonces peuvent ne pas avoir été affichées correctement sur la carte. La
            position des annonces est approximative.</div>
        </div>
      }
      <div id="lbca_buttons_container">
        <button id="lbca_button_toggle" className="lbca_button"
          onClick={(e) => {
            e.currentTarget.blur();
            toggleMap();
          }}>{toggleButtonText}</button>
        <button id="lbca_button_refresh" className={`lbca_button ${refreshButtonClasses}`} onClick={(e) => {
          e.currentTarget.blur();
          pressRefreshButton();
        }}>Rafraichir la carte</button>
      </div>
    </div>
  )
}

export default LBCAOverlay
