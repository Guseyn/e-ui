const STORAGE_KEY = 'e-ui-example-primary'
const DEFAULT_PRIMARY = '#3551A4'

const PICKER_STYLES = `
input[type="color"][data-e-primary-picker] {
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 2px solid color-mix(in srgb, var(--e-primary) 35%, #c8c8c8);
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
  overflow: hidden;
  flex-shrink: 0;
}
input[type="color"][data-e-primary-picker]::-webkit-color-swatch-wrapper {
  padding: 0;
}
input[type="color"][data-e-primary-picker]::-webkit-color-swatch {
  border: none;
  border-radius: 50%;
}
input[type="color"][data-e-primary-picker]::-moz-color-swatch {
  border: none;
  border-radius: 50%;
}
`

function cssColorToHex(color) {
  if (!color) return DEFAULT_PRIMARY
  const value = color.trim()
  if (value.startsWith('#')) {
    if (value.length === 4) {
      return `#${[...value.slice(1)].map((c) => c + c).join('')}`.toLowerCase()
    }
    return value.slice(0, 7).toLowerCase()
  }
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (!match) return DEFAULT_PRIMARY
  return `#${[match[1], match[2], match[3]]
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')}`
}

function injectStyles() {
  if (document.getElementById('e-primary-picker-styles')) return
  const style = document.createElement('style')
  style.id = 'e-primary-picker-styles'
  style.textContent = PICKER_STYLES
  document.head.appendChild(style)
}

function applyPrimary(color) {
  document.documentElement.style.setProperty('--e-primary', color)
}

function currentPrimary() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return cssColorToHex(saved)
  return cssColorToHex(
    getComputedStyle(document.documentElement).getPropertyValue('--e-primary')
  ) || DEFAULT_PRIMARY
}

function syncPickers(color) {
  document.querySelectorAll('input[type="color"][data-e-primary-picker]').forEach((input) => {
    if (input.value.toLowerCase() !== color.toLowerCase()) {
      input.value = color
    }
  })
}

function initExamplePrimaryPicker() {
  injectStyles()
  const color = currentPrimary()
  applyPrimary(color)
  syncPickers(color)

  document.addEventListener('input', (event) => {
    const input = event.target
    if (!(input instanceof HTMLInputElement)) return
    if (input.type !== 'color' || !input.hasAttribute('data-e-primary-picker')) return
    const next = cssColorToHex(input.value)
    applyPrimary(next)
    localStorage.setItem(STORAGE_KEY, next)
    syncPickers(next)
  })

  const observer = new MutationObserver(() => {
    syncPickers(currentPrimary())
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

initExamplePrimaryPicker()

export { initExamplePrimaryPicker }
