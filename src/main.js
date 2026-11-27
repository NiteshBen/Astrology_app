import './style.css'
import { calculateChart, degreesInSign, glyphs, signs } from './chart.js'

const form = document.querySelector('#birth-form')
const date = document.querySelector('#birth-date')
const time = document.querySelector('#birth-time')
const unknown = document.querySelector('#unknown-time')
const cityInput = document.querySelector('#birth-city')
const list = document.querySelector('#city-options')
const cityHelp = document.querySelector('#city-help')
const error = document.querySelector('#form-error')
const result = document.querySelector('#result')
const today = new Date()
date.max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' })
let selectedCity
let matches = []
let active = -1
let cityLookup

function showError(message = '') {
  error.textContent = message
  error.hidden = !message
}

function closeCities() {
  list.hidden = true
  active = -1
  cityInput.setAttribute('aria-expanded', 'false')
  cityInput.removeAttribute('aria-activedescendant')
}

function chooseCity(city) {
  selectedCity = city
  cityInput.value = city.city + ', ' + city.country
  cityHelp.textContent = [city.province, city.timezone].filter(Boolean).join(' · ')
  cityInput.setCustomValidity('')
  closeCities()
}

async function searchCities() {
  const query = cityInput.value.trim()
  closeCities()
  if (query.length < 2) return
  try {
    cityLookup ??= import('city-timezones')
    const { default: { cityMapping } } = await cityLookup
    if (cityInput.value.trim() !== query || selectedCity || document.activeElement !== cityInput) return
    const needle = query.split(',')[0].toLowerCase()
    matches = cityMapping
      .filter(({ city, city_ascii }) => [city, city_ascii].some((name) => name?.toLowerCase().startsWith(needle)))
      .sort((a, b) => Number(b.city.toLowerCase() === needle) - Number(a.city.toLowerCase() === needle) || b.pop - a.pop)
      .slice(0, 8)
    list.replaceChildren()
    matches.forEach((city, index) => {
      const option = document.createElement('li')
      option.id = `city-option-${index}`
      option.role = 'option'
      option.setAttribute('aria-selected', 'false')
      option.textContent = [...new Set([city.city, city.province, city.country].filter(Boolean))].join(', ')
      option.addEventListener('mousedown', (event) => event.preventDefault())
      option.addEventListener('click', () => chooseCity(city))
      list.append(option)
    })
    cityHelp.textContent = matches.length ? 'Select a city from the suggestions.' : 'No matching city. Try a nearby city in the same time zone.'
    list.hidden = matches.length === 0
    cityInput.setAttribute('aria-expanded', String(!list.hidden))
  } catch {
    cityLookup = undefined
    cityHelp.textContent = 'City search could not load. Try typing the city again.'
  }
}

cityInput.addEventListener('input', () => {
  selectedCity = undefined
  cityInput.setCustomValidity('')
  cityHelp.textContent = 'Select a city from the suggestions.'
  searchCities()
})
cityInput.addEventListener('focus', () => { if (!selectedCity) searchCities() })
cityInput.addEventListener('blur', closeCities)
cityInput.addEventListener('keydown', (event) => {
  if (list.hidden) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeCities()
  } else if (event.key === 'Enter' && active >= 0) {
    event.preventDefault()
    chooseCity(matches[active])
  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    active = active < 0 && event.key === 'ArrowUp'
      ? matches.length - 1
      : (active + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
    Array.from(list.children).forEach((option, index) => option.setAttribute('aria-selected', String(index === active)))
    cityInput.setAttribute('aria-activedescendant', list.children[active].id)
    list.children[active].scrollIntoView({ block: 'nearest' })
  }
})

unknown.addEventListener('change', () => {
  time.disabled = unknown.checked
  time.required = !unknown.checked
})

const gridPlaces = [[1,2],[1,3],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[3,1],[2,1],[1,1]]
const abbreviated = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' }

function chartGrid(chart) {
  return signs.map((sign, index) => {
    const [row, column] = gridPlaces[index]
    const bodies = chart.planets.filter((planet) => planet.sign === index)
    const ascends = chart.rising?.sign === index
    return `<div class="chart-cell${ascends ? ' rising-cell' : ''}" style="grid-area:${row}/${column}">
      <small>${sign}</small>
      <div class="chart-symbols">${ascends ? '<abbr title="Ascendant">Asc</abbr>' : ''}${bodies.map(({ name }) => `<abbr title="${name}">${abbreviated[name]}</abbr>`).join(' ')}</div>
    </div>`
  }).join('')
}

function renderChart(chart) {
  const { rising, moon, nakshatra, pada, planets } = chart
  result.innerHTML = `
    <div class="result-heading">
      <div><p class="eyebrow"><span></span> YOUR JANAM KUNDLI</p><h2 id="result-title" tabindex="-1">Your birth chart</h2><p id="birth-summary"></p></div>
      <a class="text-link" href="#birth-date">Edit birth details ↑</a>
    </div>
    ${rising ? '' : '<p class="notice">Birth time is unknown. This chart uses local noon. Your Moon sign, nakshatra and pada may change across the day. The ascendant and houses are omitted.</p>'}
    <div class="summaries">
      <article><span aria-hidden="true">${rising ? glyphs[rising.sign] : '–'}</span><h3>Ascendant</h3><p>${rising ? signs[rising.sign] : 'Birth time required'}</p></article>
      <article><span aria-hidden="true">☾</span><h3>Moon sign</h3><p>${signs[moon.sign]}</p></article>
      <article><span aria-hidden="true">✧</span><h3>Nakshatra</h3><p>${nakshatra} <small>· Pada ${pada}</small></p></article>
    </div>
    <div class="result-detail">
      <div class="detail-card"><h3>Rashi chart</h3><p>South Indian layout</p><div class="chart-grid" aria-hidden="true">${chartGrid(chart)}<div class="chart-center"><b>✺</b><span>D1</span></div></div></div>
      <div class="detail-card"><h3>Planetary placements</h3>
        <table><thead><tr><th scope="col">Graha</th><th scope="col">Sign</th><th scope="col">Degree</th>${rising ? '<th scope="col">House</th>' : ''}</tr></thead>
        <tbody>${planets.map((planet) => `<tr><th scope="row">${planet.name}</th><td>${signs[planet.sign]}</td><td>${degreesInSign(planet.longitude)}</td>${rising ? `<td>${planet.house}</td>` : ''}</tr>`).join('')}</tbody></table>
      </div>
    </div>`
  result.querySelector('#birth-summary').textContent = [
    formatter.format(new Date(date.value)), unknown.checked ? 'Time unknown' : time.value, selectedCity.city, selectedCity.timezone,
  ].join(' · ')
  result.hidden = false
  const heading = result.querySelector('#result-title')
  heading.focus({ preventScroll: true })
  result.scrollIntoView({ block: 'start' })
}

form.addEventListener('input', () => {
  showError()
  result.hidden = true
  result.replaceChildren()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!selectedCity) {
    showError('Select a birthplace from the suggestions to continue.')
    cityInput.focus()
    return
  }
  try {
    renderChart(calculateChart({ date: date.value, time: unknown.checked ? null : time.value, city: selectedCity }))
  } catch (failure) {
    showError(failure.message || 'The chart could not be calculated. Check your birth details and try again.')
  }
})

form.querySelector('button[type=submit]').disabled = false
