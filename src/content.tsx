import leafletCss from "data-text:leaflet/dist/leaflet.css"
import lbcaCss from "data-text:~/shared/styles/lbca.less"
import popupCss from "data-text:~/shared/styles/map_popup.less"

import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"
import LBCAMap from "./shared/components/map"
import { WebpageParser } from "./shared/parser/webpageparser"
import { Geocoder } from "~shared/geocoder/geocoder"
import type { GeocodedItem, Item } from "~shared/parser/item"
import DisclaimerMessage from "~shared/components/disclaimermessage"
import { debug } from "~shared/debug"

console.log(`♥️ Bienvenue sur LaBonneCarte ${chrome.runtime.getManifest().version}`)

export const config: PlasmoCSConfig = {
  matches: ["*://*.leboncoin.fr/*"],
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

  async function parseItemsInPage() {
    const parser = new WebpageParser(document);
    const items: Item[] = await parser.getItems();
    console.log(`LaBonneCarte - Did find ${items.length} items in current page`);

    debug.group("Geocoding");
    const report: object[] = [];
    const geocodedItems = items
      .map((item) => {
        const row = (status: string, extra: object = {}) => report.push({
          status, title: item.title.slice(0, 40), city: item.city, postCode: item.postCode, ...extra
        });

        if (item.coordinates) {
          row("OK: embedded coordinates", { lat: item.coordinates.lat, lng: item.coordinates.lng });
          return item as GeocodedItem;
        }

        const result = Geocoder.geocode(item);
        const candidates = result.candidates.map((c) => `${c.n} / ${c.l}`).join(", ");
        if (!result.commune) {
          row(`FAILED: ${result.reason}`, { candidates });
          debug.warn(`Geocoding failed for "${item.title}": ${result.reason}`, { item, candidates: result.candidates });
          return undefined;
        }

        row(`OK: ${result.reason}`, { lat: result.commune.lt, lng: result.commune.ln, commune: result.commune.n, candidates });
        const geocodedItem: GeocodedItem = {
          ...item,
          coordinates: {
            lat: result.commune.lt,
            lng: result.commune.ln
          }
        }
        return geocodedItem
      })
      .filter((item) => item);
    debug.table(report);
    debug.groupEnd();

    console.log(`LaBonneCarte - Could geocode ${geocodedItems.length}/${items.length} items in current page`);

    setGeocodedItems(geocodedItems);
  }

  return (
    <div>
      <div id="lbca_black_overlay" className={overlayClasses} onClick={hideMap}></div>

      {isMapVisible &&
        <div id="lbca_map_container" className={mapContainerClasses}>
          <LBCAMap geocodedItems={geocodedItems} />
          <DisclaimerMessage geocodedItems={geocodedItems} />
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
