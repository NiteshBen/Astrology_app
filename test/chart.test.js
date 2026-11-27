import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { calculateChart, degreesInSign } from '../src/chart.js'

// Swiss Ephemeris 2.10.03, Lahiri sidereal flag, Moshier positions and mean nodes.
// The reference uses each city's actual historical IANA offset.
const references = JSON.parse(readFileSync(new URL('./swiss-reference.json', import.meta.url)))
const angularDifference = (a, b) => Math.abs(((a - b + 540) % 360) - 180)

for (const reference of references) {
  test(`matches Swiss Ephemeris for ${reference.date} in ${reference.city.timezone}`, () => {
    const { rising, moon, planets } = calculateChart(reference)
    assert.ok(angularDifference(rising.longitude, reference.ascendant) < 0.01)
    assert.equal(rising.sign, Math.floor(reference.ascendant / 30))
    assert.equal(planets.length, 9)
    planets.forEach((planet, index) => {
      assert.ok(angularDifference(planet.longitude, reference.longitudes[index]) < 0.01, planet.name)
      assert.equal(planet.sign, Math.floor(reference.longitudes[index] / 30))
      assert.equal(planet.house, ((planet.sign - rising.sign + 12) % 12) + 1)
    })
    assert.equal(moon, planets[1])
    assert.ok(angularDifference(planets[7].longitude, planets[8].longitude) > 179.999)
  })
}

test('returns the lunar mansion and pada for the New Delhi example', () => {
  const { nakshatra, pada } = calculateChart(references[0])
  assert.equal(nakshatra, 'Shatabhisha')
  assert.equal(pada, 4)
})

test('uses local noon and omits houses when birth time is unknown', () => {
  const exact = calculateChart({ ...references[0], time: '12:00' })
  const estimate = calculateChart({ ...references[0], time: null })
  assert.equal(estimate.rising, null)
  assert.deepEqual(estimate.planets, exact.planets.map((planet) => ({ ...planet, house: null })))
})

test('rejects skipped and repeated local clock times', () => {
  const city = references[1].city
  assert.throws(() => calculateChart({ date: '2024-03-10', time: '02:30', city }), /missing or repeated/)
  assert.throws(() => calculateChart({ date: '2024-11-03', time: '01:30', city }), /missing or repeated/)
})

test('rejects invalid calendar dates and unsupported years', () => {
  assert.throws(() => calculateChart({ ...references[0], date: '1990-02-30' }), RangeError)
  assert.throws(() => calculateChart({ ...references[0], date: '1899-12-31' }), /1900 and 2100/)
})

test('formats degrees without rounding across an adjacent sign', () => {
  assert.equal(degreesInSign(59.9999), '29° 59′')
  assert.equal(degreesInSign(60), '0° 00′')
})
