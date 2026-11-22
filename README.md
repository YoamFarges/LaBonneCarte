# LaBonneCarte
_A published extension  to display leboncoin's (sort of french craigslist) search results on a map._


Leboncoin is the main website to buy and sell stuff in France, but for some reason, there is no way to display the results of your search directly on a map. This simple extension aims at fixing that.

![Screenshot of LaBonneCarte in action](https://i.imgur.com/teRI705.jpeg)

|Browser|Store link|
| - | - |
| Chrome | https://chrome.google.com/webstore/detail/la-bonne-carte/oegacpncaonolgbpmphcimodilfoacnl |
| Firefox | https://addons.mozilla.org/fr/firefox/addon/labonnecarte/ |

### Disclaimer
- I am not affiliated at all with leboncoin.
- Some sentences of the extension are in french only as the target website is french only.
- The code is just a fun project for me, in order to learn how to make Chrome extensions. It is not in a clean production state, has some known drawbacks, some magic numbers, and has no tests. All PRs are welcome.

#### Installation + Run

```
npm install

npm run dev
or
npm run dev:firefox
or
npm run dev:safari
```

A folder (e.g. `chrome-mv3-dev`) will be generated on the `build` subfolder. You simply have to load the unpacked extension in your browser. See https://docs.plasmo.com/framework/workflows/dev for more information.

#### Build + Release

```
npm run typecheck
npm run build:all      # Chrome + Firefox zips in build/
```

#### CI/CD

- **CI** (`ci.yml`): every PR runs a typecheck and builds the Chrome and Firefox zips (downloadable from the run's artifacts).
- **Build** (`build.yml`): when a GitHub release is published, builds the Chrome zip, the Firefox zip and a source zip (for Mozilla's review) and attaches them to the release.
- **Release and deploy** (`deploy.yml`), run by hand from the Actions tab on `main`:
  1. bump `version` in `package.json` and add a `## <version>` section to `CHANGELOG.md`, merge to `main`;
  2. run the workflow: it tags the commit (e.g. `4.3.0`), creates the GitHub release with the changelog section as notes, builds and attaches the zips, then submits them to the Chrome Web Store and Firefox Add-ons.

  The "Stores" option: `publish` uploads and submits for review, `draft` uploads only (submit by hand in the store dashboard), `skip` only creates the GitHub release. Before creating anything, the workflow checks that the Chrome credentials work. Store submission needs these repository secrets (a store is skipped if its secrets are missing):
  - Chrome: `CHROME_CLIENT_ID`, `CHROME_CLIENT_SECRET`, `CHROME_REFRESH_TOKEN` (OAuth client of the Google Cloud project, refresh token from `npx chrome-webstore-upload-keys`)
  - Firefox: `FIREFOX_API_KEY` (JWT issuer), `FIREFOX_API_SECRET` (JWT secret), `FIREFOX_EXT_ID` (add-on UUID)

The version displayed in the extension comes from `package.json` (through the manifest), so it only needs to be changed there.

### Stack overview

#### Plasmo

The extension uses https://plasmo.com/ for an easier maintenance.

Follow the very simple steps to the [https://docs.plasmo.com/](plasmo documentation) in order to run the project locally.

#### Leaflet

For the map feature, this project extensively uses [https://leafletjs.com/](Leaflet) and [https://react-leaflet.js.org/](react-leaflet).

#### Geocoding

To prevent browser limitation when using geocoding API from a chrome extension, the geocoding is made directly within the extension. The data comes from https://www.data.gouv.fr/fr/datasets/base-officielle-des-codes-postaux/.

### Licence

See LICENCE.md
