import cssText from "data-text:~/contents/lbca_overlay.less"
import type {PlasmoCSConfig} from "plasmo"
import {useState} from "react"

console.log("♥️ Bienvenue sur LaBonneCarte.")

export const config: PlasmoCSConfig = {
  matches: ["*://*.leboncoin.fr/*", "*://*.piruzap.com/*", "*://*.plasmo.com/*"],
  all_frames: true
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}


const LBCAOverlay = () => {
  const [isMapVisible, setIsMapVisible] = useState(false);

  const mapContainerClasses = isMapVisible ? "visible slide" : "hidden fade";
  const refreshButtonClasses = isMapVisible ? "visible fade" : "hidden fade";
  const overlayClasses = isMapVisible ? "visible fade" : "hidden fade";
  const toggleButtonText = isMapVisible ? "Masquer la carte" : "Afficher la recherche sur la carte"

  function toggleMap() {
    console.log("Map button");

    setIsMapVisible(!isMapVisible);
  }

  function hideMap() {
    setIsMapVisible(false);
  }

  function pressRefreshButton() {
    console.log("Refresh button")
  }

  return (
    <div>
      <div id="lbca_black_overlay" className={overlayClasses} onClick={hideMap}></div>

      <div id="lbca_map_container" className={mapContainerClasses}>
        <div id="lbca_map"></div>
        <div id="lbca_warning">Certaines annonces peuvent ne pas avoir été affichées correctement sur la carte. La
          position des annonces est approximative.</div>
      </div>
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
