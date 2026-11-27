import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { calculatePanchang, defaultCity, localDate, moveDate } from '../src/panchang.js'

// Swiss Ephemeris 2.10.03, Moshier positions, standard horizon refraction,
// and roots of the geocentric Moon–Sun longitude difference at 12° intervals.
const references = JSON.parse(readFileSync(new URL('./swiss-panchang-reference.json', import.meta.url)))
for (const { date, city, sunrise, sunset, transitions } of references) {
  test(`matches solar events and tithi transitions in ${city.timezone} on ${date}`, () => {
    const result = calculatePanchang(date, city)
    assert.ok(Math.abs(result.sunrise - new Date(sunrise)) < 10000)
    assert.ok(Math.abs(result.sunset - new Date(sunset)) < 10000)
    assert.equal(result.transitions.length, transitions.length)
    result.transitions.forEach(({ at }, i) => assert.ok(Math.abs(at - new Date(transitions[i])) < 60000))
  })
}

test('uses the selected city’s local date and preserves calendar days across clock changes', () => {
  const instant = new Date('2024-03-10T02:00:00Z')
  assert.equal(localDate('America/New_York', instant), '2024-03-09')
  assert.equal(localDate('Asia/Kolkata', instant), '2024-03-10')
  assert.equal(moveDate('2024-03-10', 1), '2024-03-11')
  assert.equal(moveDate('2024-03-01', -1), '2024-02-29')
})

test('separates sunrise and current tithi after a transition', () => {
  const result = calculatePanchang('2026-11-27', defaultCity, new Date('2026-11-27T17:00:00Z'))
  assert.notDeepEqual(result.atSunrise, result.current)
  assert.deepEqual(result.transitions.at(-1).to, result.current)
  assert.equal(calculatePanchang('2026-11-26', defaultCity, new Date('2026-11-27T17:00:00Z')).current, null)
})

test('uses weekday daylight segments and omits Wednesday Abhijit', () => {
  const friday = calculatePanchang('2026-11-27', defaultCity)
  const duration = friday.sunset - friday.sunrise
  assert.ok(Math.abs(friday.windows.rahu[0] - friday.sunrise - duration * 3 / 8) < 1)
  assert.ok(Math.abs(friday.windows.abhijit[1] - friday.windows.abhijit[0] - duration / 15) < 1)
  assert.equal(friday.sunrise - friday.windows.brahma[0], 96 * 60000)
  const wednesday = calculatePanchang('2024-07-17', references[2].city)
  assert.equal(wednesday.windows.abhijit, null)
  assert.ok(Math.abs(wednesday.windows.rahu[0] - (wednesday.sunrise.getTime() + (wednesday.sunset - wednesday.sunrise) / 2)) < 1)
})

test('handles a polar day and a civil date skipped by a time-zone change', () => {
  const result = calculatePanchang('2024-06-21', { lat: 69.65, lng: 18.96, timezone: 'Europe/Oslo' })
  assert.equal(result.sunrise, null)
  assert.equal(result.sunset, null)
  assert.equal(result.atSunrise, null)
  assert.ok(result.atStart.name)
  assert.deepEqual(result.windows, { rahu: null, abhijit: null, brahma: null })
  assert.throws(() => calculatePanchang('2011-12-30', { lat: -13.83, lng: -171.77, timezone: 'Pacific/Apia' }), /skipped/)
})
