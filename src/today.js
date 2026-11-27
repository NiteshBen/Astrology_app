import './style.css'
import { setupCityPicker } from './city-picker.js'
import { calculatePanchang, defaultCity, localDate, moveDate } from './panchang.js'

const query = (selector) => document.querySelector(selector)
const date = query('#panchang-date')
const results = query('#panchang-results')
const error = query('#panchang-error')
const previous = query('#previous-day')
const next = query('#next-day')
const today = query('#reset-day')
const dateLabel = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeZone: 'UTC' })
let followToday = true

const cityPicker = setupCityPicker({
  cityInput: query('#panchang-city'),
  list: query('#panchang-options'),
  cityHelp: query('#panchang-city-help'),
  onEdit: render,
  onSelect: refresh,
})

function showError(message) {
  error.hidden = !message
  error.textContent = message
  results.replaceChildren()
}

function formatTithi(tithi) {
  return tithi ? `${tithi.name} · ${tithi.paksha}` : 'Unavailable'
}

function render() {
  const city = cityPicker.selected
  const day = date.value
  previous.disabled = !city || !day || !date.validity.valid || day <= date.min
  next.disabled = !city || !day || !date.validity.valid || day >= date.max
  today.disabled = !city
  if (!city || !day || !date.validity.valid) {
    showError(!city ? 'Choose a city from the suggestions to see its Panchang.' : 'Choose a date between 1900 and 2100.')
    return
  }
  let data
  try {
    data = calculatePanchang(day, city)
  } catch (failure) {
    showError(failure.message)
    return
  }
  showError('')
  const time = new Intl.DateTimeFormat('en', { timeStyle: 'short', timeZone: city.timezone })
  const formatTime = (instant) => {
    if (!instant) return 'Unavailable'
    const actualDay = localDate(city.timezone, instant)
    const suffix = actualDay < day ? ' (previous day)' : actualDay > day ? ' (next day)' : ''
    return time.format(instant) + suffix
  }
  const formatWindow = (window, unavailable = 'Unavailable') => window ? window.map(formatTime).join(' – ') : unavailable
  const { sunrise, sunset, windows, atStart, atSunrise, current, transitions, isWednesday } = data
  results.innerHTML = `
    <section class="panchang-card lunar-card" aria-labelledby="lunar-title">
      <div>
        <p class="eyebrow" id="panchang-location"></p>
        <h2 id="lunar-title">Tithi</h2>
        <p class="day-label">${dateLabel.format(new Date(day))}</p>
        <dl class="tithi-details">
          <div><dt>${sunrise ? 'At sunrise' : 'At start of day'}</dt><dd>${formatTithi(atSunrise ?? atStart)}</dd></div>
          ${current ? `<div><dt>Current tithi</dt><dd>${formatTithi(current)}</dd></div>` : ''}
        </dl>
      </div>
      <div class="transition-list">
        <h3>Tithi transitions</h3>
        ${transitions.length ? `<ul>${transitions.map(({ at, to }) => `<li><time datetime="${at.toISOString()}">${formatTime(at)}</time><span>${formatTithi(to)} begins</span></li>`).join('')}</ul>` : '<p>No tithi change on this local date.</p>'}
      </div>
    </section>
    <section class="timing-grid" aria-label="Local timings">
      <article class="panchang-card"><h3>Sunrise &amp; sunset</h3><dl class="timing-details"><div><dt>Sunrise</dt><dd>${formatTime(sunrise)}</dd></div><div><dt>Sunset</dt><dd>${formatTime(sunset)}</dd></div></dl></article>
      <article class="panchang-card"><h3>Rahu Kaal</h3><p class="timing-value">${formatWindow(windows.rahu)}</p><p>Traditionally avoided for starting new activities.</p></article>
      <article class="panchang-card"><h3>Favourable windows</h3><dl class="timing-details"><div><dt>Brahma Muhurat</dt><dd>${formatWindow(windows.brahma)}</dd></div><div><dt>Abhijit Muhurat</dt><dd>${formatWindow(windows.abhijit, isWednesday ? 'Omitted on Wednesday' : 'Unavailable')}</dd></div></dl></article>
    </section>`
  query('#panchang-location').textContent = `${city.city}, ${city.country} · ${city.timezone}`
}

function refresh() {
  if (followToday && cityPicker.selected) date.value = localDate(cityPicker.selected.timezone)
  render()
}

function navigate(days) {
  followToday = false
  date.value = moveDate(date.value, days)
  render()
}

previous.addEventListener('click', () => navigate(-1))
next.addEventListener('click', () => navigate(1))
date.addEventListener('change', () => {
  followToday = false
  render()
})
today.addEventListener('click', () => {
  followToday = true
  refresh()
})
cityPicker.select(defaultCity)
setInterval(() => {
  if (cityPicker.selected && date.value && (followToday || date.value === localDate(cityPicker.selected.timezone))) refresh()
}, 60000)
