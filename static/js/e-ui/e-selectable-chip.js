class ESelectableChip extends HTMLElement {
  constructor() {
    super()
    this.selected = false
    this.ehtmlActivated = false
  }

  connectedCallback() {
    this.addEventListener(
      'ehtml:activated',
      () => this.#onEHTMLActivated(),
      { once: true }
    )
  }

  #onEHTMLActivated() {
    if (this.ehtmlActivated === true) {
      return
    }
    this.ehtmlActivated = true
    this.#run()
  }

  #run() {
    if (this.hasAttribute('data-value')) {
      this.value = this.getAttribute('data-value')
      this.removeAttribute('data-value')
    }
    if (this.getAttribute('data-selected') === 'true') {
      this.select()
    }

    this.setAttribute('role', 'button')
    this.tabIndex = 0
    this.setAttribute('data-focusable', '')
    if (!this.hasAttribute('aria-label')) {
      this.setAttribute('aria-label', buildAccessibleName(this))
    }
    this.setAttribute('aria-pressed', this.selected ? 'true' : 'false')

    this.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this.click()
      }
    })

    this.addEventListener('click', (event) => {
      event.preventDefault()
      if (!this.selected) {
        this.select()
      } else {
        this.unselect()
      }
    })
  }

  select() {
    this.selected = true
    this.setAttribute('data-selected', 'true')
    this.setAttribute('aria-pressed', 'true')
  }

  unselect() {
    this.selected = false
    this.removeAttribute('data-selected')
    this.setAttribute('aria-pressed', 'false')
  }
}

function buildAccessibleName(chip) {
  const text = chip.textContent.trim()
  if (text) {
    return text
  }
  if (chip.hasAttribute('data-text')) {
    return chip.getAttribute('data-text')
  }
  if (chip.value) {
    return chip.value
  }
  return 'Selectable option'
}

customElements.define('e-selectable-chip', ESelectableChip)
