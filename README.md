# Tara Ved

Tara Ved is a mobile-friendly Vedic astrology website. Phase 1 provides a public Janam Kundli calculator, a South Indian D1 chart, and a table of graha placements. It runs in the browser without an account or a server that receives birth details.

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

## GitHub Pages

In the repository's **Settings → Pages**, choose **GitHub Actions** as the source. The `Deploy GitHub Pages` workflow runs the calculation tests before building and publishing the site on pushes to `main`. If Pages was enabled after the push, dispatch the workflow from the Actions tab.
