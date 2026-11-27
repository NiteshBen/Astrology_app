import { Body, MoonPhase, Observer, SearchMoonPhase, SearchRiseSet } from 'astronomy-engine'
import { Temporal } from '@js-temporal/polyfill'

export const defaultCity = {
  city: 'New Delhi', country: 'India', province: 'Delhi',
  lat: 28.60002301, lng: 77.19998002, timezone: 'Asia/Kolkata',
}

const tithiNames = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi']
const rahuSegments = [2, 7, 5, 6, 4, 3, 8] // ISO weekdays, Monday through Sunday.
const minute = 60000

export function localDate(timezone, instant = new Date()) {
  return Temporal.Instant.fromEpochMilliseconds(instant.getTime()).toZonedDateTimeISO(timezone).toPlainDate().toString()
}

export function moveDate(date, days) {
  return Temporal.PlainDate.from(date).add({ days }).toString()
}

function tithi(index) {
  return {
    name: index === 14 ? 'Purnima' : index === 29 ? 'Amavasya' : tithiNames[index % 15],
    paksha: index < 15 ? 'Shukla Paksha' : 'Krishna Paksha',
  }
}

function tithiIndex(instant) {
  return Math.floor(MoonPhase(instant) / 12)
}

function boundaries(start, end) {
  let index = tithiIndex(start)
  let from = start
  const transitions = []
  while (from < end) {
    index = (index + 1) % 30
    const match = SearchMoonPhase(index * 12, from, (end - from) / 86400000)
    if (!match || match.date >= end) break
    transitions.push({ at: match.date, to: tithi(index) })
    from = new Date(match.date.getTime() + 1000)
  }
  return transitions
}

export function calculatePanchang(date, city, now = new Date()) {
  const day = Temporal.PlainDate.from(date)
  if (day.year < 1900 || day.year > 2100) throw new Error('Choose a date between 1900 and 2100.')
  const localDay = day.toZonedDateTime(city.timezone)
  if (!localDay.toPlainDate().equals(day)) throw new Error('That local date was skipped due to a time-zone change.')
  const start = new Date(localDay.epochMilliseconds)
  const end = new Date(day.add({ days: 1 }).toZonedDateTime(city.timezone).epochMilliseconds)
  const observer = new Observer(city.lat, city.lng, 0)
  function sunEvent(direction) {
    const event = SearchRiseSet(Body.Sun, observer, direction, start, (end - start) / 86400000)
    return event && event.date < end ? event.date : null
  }
  const sunrise = sunEvent(1)
  const sunset = sunEvent(-1)
  const daytime = sunrise && sunset ? sunset - sunrise : 0
  const windows = {
    rahu: null,
    abhijit: null,
    brahma: sunrise ? [96, 48].map((minutes) => new Date(sunrise.getTime() - minutes * minute)) : null,
  }
  if (daytime > 0) {
    const rahuSegment = rahuSegments[day.dayOfWeek - 1]
    windows.rahu = [rahuSegment - 1, rahuSegment].map((segment) => new Date(sunrise.getTime() + daytime * segment / 8))
    if (day.dayOfWeek !== 3) {
      windows.abhijit = [7, 8].map((segment) => new Date(sunrise.getTime() + daytime * segment / 15))
    }
  }
  return {
    sunrise, sunset, windows, isWednesday: day.dayOfWeek === 3,
    atStart: tithi(tithiIndex(start)),
    atSunrise: sunrise ? tithi(tithiIndex(sunrise)) : null,
    current: now >= start && now < end ? tithi(tithiIndex(now)) : null,
    transitions: boundaries(start, end),
  }
}
