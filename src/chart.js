import { Body, Ecliptic, EclipticGeoMoon, GeoVector, SiderealTime, SunPosition } from 'astronomy-engine'
import { Temporal } from '@js-temporal/polyfill'

export const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
export const glyphs = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']
const stars = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati']
const rad = Math.PI / 180
const wrap = (degrees) => ((degrees % 360) + 360) % 360

function birthInstant(date, time, timezone) {
  const local = Temporal.PlainDateTime.from(`${date}T${time}`)
  if (local.year < 1900 || local.year > 2100) {
    throw new Error('Choose a date between 1900 and 2100.')
  }
  try {
    return new Date(local.toZonedDateTime(timezone, { disambiguation: 'reject' }).epochMilliseconds)
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    throw new Error('That local time is missing or repeated because of a clock change. Choose a different time, or use the unknown-time option.')
  }
}

function ascendant(date, city, centuries) {
  const meridian = (SiderealTime(date) * 15 + city.lng) * rad
  const obliquity = (23.4392911 - 0.0130042 * centuries) * rad
  const latitude = city.lat * rad
  const x = Math.sin(meridian) * Math.cos(obliquity) + Math.tan(latitude) * Math.sin(obliquity)
  return wrap(Math.atan2(Math.cos(meridian), -x) / rad)
}

function placement(name, tropical, correction, risingSign) {
  const longitude = wrap(tropical - correction)
  const sign = Math.floor(longitude / 30)
  return { name, longitude, sign, house: risingSign === null ? null : ((sign - risingSign + 12) % 12) + 1 }
}

export function calculateChart({ date, time, city }) {
  const instant = birthInstant(date, time || '12:00', city.timezone)
  const centuries = (instant.getTime() / 86400000 + 2440587.5 - 2451545) / 36525
  // Mean Lahiri offset at J2000, with precession over the supported date range.
  const correction = 23.857092 + 1.3969713 * centuries + 0.0003086 * centuries ** 2
  const rising = time ? placement('Ascendant', ascendant(instant, city, centuries), correction, null) : null
  const moonLongitude = EclipticGeoMoon(instant).lon
  const node = 125.04452 - 1934.136261 * centuries + 0.0020708 * centuries ** 2 + centuries ** 3 / 450000
  const bodies = [
    ['Sun', SunPosition(instant).elon],
    ['Moon', moonLongitude],
    ...['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].map((name) => [name, Ecliptic(GeoVector(Body[name], instant, true)).elon]),
    ['Rahu', node],
    ['Ketu', node + 180],
  ]
  const planets = bodies.map(([name, longitude]) => placement(name, longitude, correction, rising?.sign ?? null))
  const moon = planets[1]
  const quarter = Math.floor(moon.longitude / (360 / 108))
  return { rising, moon, nakshatra: stars[Math.floor(quarter / 4)], pada: quarter % 4 + 1, planets }
}

export function degreesInSign(longitude) {
  const arcMinutes = Math.floor((longitude % 30) * 60)
  return `${Math.floor(arcMinutes / 60)}° ${String(arcMinutes % 60).padStart(2, '0')}′`
}
