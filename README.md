# LaBonneCarte
_A published [**chrome extension**](https://chrome.google.com/webstore/detail/la-bonne-carte/oegacpncaonolgbpmphcimodilfoacnl) to display leboncoin's (sort of french craigslist) search results on a map._

Leboncoin is the main website to buy and sell stuff in France, but for some reason, there is no way to display the results of your search directly on a map. This simple extension aims at fixing that.

![Screenshot of LaBonneCarte in action](https://i.imgur.com/teRI705.jpeg)

### Disclaimer
- I am not affiliated at all with leboncoin.
- Some sentences of the extension are in french only as the target website is french only.
- The code is just a fun project for me, in order to learn how to make Chrome extensions. It is not in a clean production state, has some known drawbacks, some magic numbers, and has no tests. All PRs are welcome.

### Stack

#### Plasmo

The extension was previously made natively and was ported to https://plasmo.com/ for an easier maintenance.

Follow the very simple steps to the [https://docs.plasmo.com/](plasmo documentation) in order to run the project locally.

#### Leaflet

For the map feature, this project extensively uses [https://leafletjs.com/](Leaflet) and [https://react-leaflet.js.org/](react-leaflet).

#### Geocoding

To prevent browser limitation when using geocoding API from a chrome extension, the geocoding is made directly within the extension. The data comes from https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/.

### Licence

See LICENCE.md
