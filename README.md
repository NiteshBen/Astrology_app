# Tara Ved

Tara Ved is a mobile-friendly Vedic astrology website. Phase 1 provides a public Janam Kundli calculator, a South Indian D1 chart, and a table of graha placements. Phase 2 adds a public Today & Panchang page with city-local lunar and solar timings. The tools run in the browser without an account or a server that receives birth details.

## Development

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The build creates a static website in `dist/`. Relative asset URLs support hosting under a repository path.

## Calculation conventions

- Astronomy Engine calculates geocentric planetary and lunar positions. A mean Lahiri offset, approximated by a precession polynomial, converts the longitudes to the sidereal zodiac.
- The chart uses mean lunar nodes and whole-sign houses. The Moon's longitude determines its nakshatra and pada. The ascendant uses local sidereal time and the selected city's latitude and longitude.
- The bundled city-timezones catalogue supplies city centres and IANA time-zone IDs. The browser's time-zone data converts historical local times. A repeated or skipped clock time requires correction or the unknown-time option.
- The form accepts dates from 1900 through today within the engine's supported range of 1900–2100. Unknown time uses local noon and hides the ascendant and houses. The Moon's sign, nakshatra, and pada may differ at the actual birth time.
- Chart values near boundaries may differ from tools that use another city centre, ephemeris, ayanamsha, node model, or time-zone database.

## Panchang conventions

- The selected city's IANA time zone defines the date and its civil-day boundaries. Today follows that city, and browsing a different date keeps that date selected when switching cities.
- Tithi changes at multiples of 12° of geocentric Moon–Sun elongation. The page shows the tithi at sunrise, the current tithi on the city's current date, and transitions during the selected date.
- Sunrise and sunset use a standard unobstructed horizon at sea-level observer elevation. Rahu Kaal uses the customary weekday segment of eight equal daylight parts. Abhijit is the central fifteenth of daylight and is omitted on Wednesday. Brahma Muhurat runs from 96 to 48 minutes before sunrise.
- Regional conventions and local terrain can produce different displayed timings. Polar days can lack sunrise or sunset. The page marks unavailable events and intervals.

## GitHub Pages

In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The `Deploy GitHub Pages` workflow runs the calculation tests before building and publishing the site on pushes to `main`. If Pages was enabled after the push, dispatch the workflow from the Actions tab.
