let cityLookup

export function setupCityPicker({ cityInput, list, cityHelp, onSelect = () => {}, onEdit = () => {} }) {
  let selectedCity
  let matches = []
  let active = -1

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
    closeCities()
    onSelect(city)
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
        option.id = `${list.id}-${index}`
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
    onEdit()
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

  return { select: chooseCity, get selected() { return selectedCity } }
}
